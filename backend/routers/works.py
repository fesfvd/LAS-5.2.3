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


@router.get("")
def list_works(
    limit: int = 20,
    offset: int = 0,
    mode: str = "",
    sort_by: str = "date",
    sort_order: str = "desc",
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    base = db.query(Work).filter(Work.user_id == user.id)
    if mode and mode in ("original", "classic"):
        base = base.filter(Work.mode == mode)
    total = base.count()

    if sort_by == "score":
        latest_score = (
            db.query(Analysis.wcs_score)
            .filter(Analysis.work_id == Work.id)
            .order_by(Analysis.created_at.desc())
            .limit(1)
            .correlate(Work)
            .scalar_subquery()
        )
        order_fn = latest_score.desc().nulls_last() if sort_order == "desc" else latest_score.asc().nulls_last()
    else:
        order_fn = Work.created_at.desc() if sort_order == "desc" else Work.created_at.asc()

    works = base.order_by(order_fn).offset(offset).limit(limit).all()
    items = []
    for w in works:
        latest = (
            db.query(Analysis)
            .filter(Analysis.work_id == w.id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
        items.append(
            WorkResponse(
                id=w.id,
                title=w.title,
                author=w.author or "",
                mode=w.mode,
                ancestor_dialogue=w.ancestor_dialogue == "true",
                created_at=w.created_at.isoformat() if w.created_at else "",
                latest_status=latest.status if latest else None,
                latest_wcs_score=latest.wcs_score if latest else None,
                latest_tier=latest.tier if latest else None,
            )
        )
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("", response_model=WorkResponse)
def create_work(
    req: WorkCreate, user: User = Depends(get_user), db: Session = Depends(get_session)
):
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
def get_work(
    work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)
):
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
def get_report(
    work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)
):
    work = db.query(Work).filter(Work.id == work_id, Work.user_id == user.id).first()
    if not work:
        raise HTTPException(404, "作品不存在")
    latest = (
        db.query(Analysis)
        .filter(Analysis.work_id == work.id)
        .order_by(Analysis.created_at.desc())
        .first()
    )
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
        "report_number": latest.report_number,
        "analysis_id": latest.id,
        "status": latest.status,
        "tokens": {
            "prompt": latest.prompt_tokens or 0,
            "completion": latest.completion_tokens or 0,
            "total": latest.total_tokens or 0,
        },
    }


@router.delete("/{work_id}")
def delete_work(
    work_id: str, user: User = Depends(get_user), db: Session = Depends(get_session)
):
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

    if user.role == "guest":
        from datetime import datetime as _dt, timezone as _tz
        today = _dt.now(_tz.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        count = (
            db.query(Analysis)
            .join(Work, Analysis.work_id == Work.id)
            .filter(Work.user_id == user.id, Analysis.created_at >= today, Analysis.created_at.isnot(None))
            .count()
        )
        if count >= 3:
            raise HTTPException(429, "游客每日限 3 次分析，请使用邀请码注册正式账号")

    model_used = req.model or ""
    if user.role == "guest" and model_used and "flash" not in model_used.lower():
        model_used = ""  # fallback to default (flash)

    # Assign sequential report number
    last = db.query(Analysis.report_number).filter(Analysis.report_number.isnot(None)).order_by(Analysis.report_number.desc()).first()
    next_no = (last[0] + 1) if last else 1
    analysis = Analysis(work_id=work.id, model=model_used or "default", status="running", report_number=next_no)
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    result_holder, stream = await analyze_stream(
        work.title,
        work.author or "",
        work.content,
        work.mode,
        model_used,
        ancestor_dialogue=work.ancestor_dialogue == "true",
    )

    async def event_generator():
        async for event in stream:
            if event["type"] == "done":
                # Send done event FIRST so frontend starts polling immediately
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                # Then build report + save to DB (frontend polls in parallel)
                raw = result_holder["data"] or {}
                try:
                    report = build_report(
                        raw, work.mode, raw.get("metadata", {}).get("genre", "")
                    )
                except Exception as e:
                    logger.error(
                        "报告构建异常 work_id=%s: %s\n%s",
                        work_id,
                        e,
                        traceback.format_exc(),
                    )
                    report = {
                        "ok": False,
                        "error": f"报告构建异常: {e}",
                        "raw_preview": str(raw)[:500],
                    }
                try:
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
                        if not work.author:
                            llm_author = raw.get("metadata", {}).get("author", "")
                            if llm_author:
                                work.author = llm_author
                    else:
                        analysis.status = "failed"
                    db.commit()
                except Exception as e:
                    logger.error(
                        "报告保存异常 work_id=%s: %s\n%s",
                        work_id,
                        e,
                        traceback.format_exc(),
                    )
                    analysis.report_json = {"ok": False, "error": f"报告保存异常: {e}"}
                    analysis.status = "failed"
                    try:
                        db.commit()
                    except Exception:
                        pass
                return
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
