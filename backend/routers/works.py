import json
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.models.orm import Work, Analysis, User, get_session
from backend.routers.deps import get_user
from backend.schemas.models import WorkCreate, WorkResponse, AnalyzeRequest
from backend.services.llm import analyze_stream
from backend.services.analyzer import build_report

logger = logging.getLogger("las.works")
router = APIRouter(prefix="/api/works", tags=["works"])


@router.get("", response_model=list[WorkResponse])
def list_works(user: User = Depends(get_user), db: Session = Depends(get_session)):
    works = db.query(Work).filter(Work.user_id == user.id).order_by(Work.created_at.desc()).all()
    result = []
    for w in works:
        latest = db.query(Analysis).filter(Analysis.work_id == w.id)\
            .order_by(Analysis.created_at.desc()).first()
        result.append(WorkResponse(
            id=w.id,
            title=w.title,
            author=w.author or "",
            mode=w.mode,
            ancestor_dialogue=w.ancestor_dialogue == "true",
            created_at=w.created_at.isoformat() if w.created_at else "",
            latest_status=latest.status if latest else None,
            latest_wcs_score=latest.wcs_score if latest else None,
            latest_tier=latest.tier if latest else None,
        ))
    return result


@router.post("", response_model=WorkResponse)
def create_work(req: WorkCreate, user: User = Depends(get_user), db: Session = Depends(get_session)):
    work = Work(
        user_id=user.id,
        title=req.title,
        author=req.author,
        content=req.content,
        mode=req.mode,
        ancestor_dialogue="true" if req.ancestor_dialogue else "false",
    )
    db.add(work)
    db.commit()
    db.refresh(work)
    return WorkResponse(
        id=work.id,
        title=work.title,
        author=work.author or "",
        mode=work.mode,
        ancestor_dialogue=work.ancestor_dialogue == "true",
        created_at=work.created_at.isoformat() if work.created_at else "",
    )


@router.get("/{work_id}")
def get_work(work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == user.id).first()
    if not work:
        raise HTTPException(404, "作品不存在")
    return {
        "id": work.id,
        "title": work.title,
        "author": work.author or "",
        "content": work.content,
        "mode": work.mode,
        "ancestor_dialogue": work.ancestor_dialogue == "true",
        "created_at": work.created_at.isoformat() if work.created_at else "",
    }


@router.get("/{work_id}/report")
def get_report(work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == user.id).first()
    if not work:
        raise HTTPException(404, "作品不存在")
    latest = db.query(Analysis).filter(Analysis.work_id == work.id)\
        .order_by(Analysis.created_at.desc()).first()
    if not latest or not latest.report_json:
        raise HTTPException(404, "报告不存在")
    return {
        "id": work.id,
        "title": work.title,
        "author": work.author or "",
        "mode": work.mode,
        "ancestor_dialogue": work.ancestor_dialogue == "true",
        "report": latest.report_json,
        "wcs_score": latest.wcs_score,
        "tier": latest.tier,
        "badge": latest.tier_badge,
        "analysis_id": latest.id,
        "status": latest.status,
        "tokens": {"prompt": latest.prompt_tokens or 0, "completion": latest.completion_tokens or 0, "total": latest.total_tokens or 0},
    }


@router.delete("/{work_id}")
def delete_work(work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == user.id).first()
    if not work:
        raise HTTPException(404, "作品不存在")
    db.delete(work)
    db.commit()
    return {"ok": True}


@router.post("/{work_id}/analyze")
async def start_analysis(
    work_id: str,
    req: AnalyzeRequest = AnalyzeRequest(),
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == user.id).first()
    if not work:
        raise HTTPException(404, "作品不存在")

    analysis = Analysis(work_id=work.id, model=req.model or "default", status="running")
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    result_holder, stream = await analyze_stream(
        work.title, work.author or "", work.content, work.mode, req.model,
        ancestor_dialogue=work.ancestor_dialogue == "true"
    )

    async def event_generator():
        async for event in stream:
            if event["type"] == "done":
                raw = result_holder["data"] or {}
                try:
                    report = build_report(raw, work.mode, raw.get("metadata", {}).get("genre", ""))
                except Exception as e:
                    logger.error("报告构建异常 work_id=%s: %s\n%s", work_id, e, traceback.format_exc())
                    report = {"ok": False, "error": f"报告构建异常: {e}", "raw_preview": str(raw)[:500]}
                analysis.report_json = report
                usage = result_holder.get("usage") or {}
                if usage.get("total"):
                    analysis.prompt_tokens = usage.get("prompt")
                    analysis.completion_tokens = usage.get("completion")
                    analysis.total_tokens = usage.get("total")
                if report.get("ok"):
                    analysis.status = "done"
                    analysis.wcs_score = report.get("scoring", {}).get("wcs")
                    analysis.tier = report.get("scoring", {}).get("tier", "")
                    analysis.tier_badge = report.get("scoring", {}).get("badge", "")
                    # Auto-fill author for classic mode
                    if not work.author:
                        llm_author = raw.get("metadata", {}).get("author", "")
                        if llm_author:
                            work.author = llm_author
                else:
                    analysis.status = "failed"
                db.commit()
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                return
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
