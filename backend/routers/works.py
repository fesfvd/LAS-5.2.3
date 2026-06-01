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
    search: str = "",
    score_min: float | None = None,
    score_max: float | None = None,
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    base = db.query(Work).filter(Work.user_id == user.id)
    if mode and mode in ("original", "classic"):
        base = base.filter(Work.mode == mode)
    if search:
        base = base.filter(Work.title.contains(search))
    if score_min is not None or score_max is not None:
        from sqlalchemy import and_
        conds = [Analysis.work_id == Work.id]
        if score_min is not None:
            conds.append(Analysis.wcs_score >= score_min)
        if score_max is not None:
            conds.append(Analysis.wcs_score <= score_max)
        base = base.filter(
            db.query(Analysis.work_id).filter(and_(*conds)).exists()
        )
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
    if user.role == "guest":
        content_len = len(req.content or "")
        if content_len > 50000:
            raise HTTPException(400, "游客单次提交上限 5 万字")
        # Daily 10万字 total
        from datetime import datetime as _dt, timezone as _tz
        today = _dt.now(_tz.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_total = (
            db.query(Work)
            .filter(
                Work.user_id == user.id,
                Work.created_at >= today,
            )
            .all()
        )
        daily_chars = sum(len(w.content or "") for w in today_total)
        if daily_chars + content_len > 100000:
            raise HTTPException(400, "游客每日提交上限 10 万字")
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


@router.post("/batch-delete")
def batch_delete_works(
    ids: list[str],
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    deleted = 0
    for wid in ids:
        work = db.query(Work).filter(Work.id == wid, Work.user_id == user.id).first()
        if work:
            db.delete(work)
            deleted += 1
    db.commit()
    return {"ok": True, "deleted": deleted}


@router.get("/compare")
def compare_works(
    ids: str = "",
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    """Compare up to 3 works by their dimension scores."""
    id_list = [i.strip() for i in ids.split(",") if i.strip()][:3]
    if len(id_list) < 2:
        raise HTTPException(400, "至少选择 2 个作品进行对比")
    works_data = []
    for wid in id_list:
        work = db.query(Work).filter(Work.id == wid, Work.user_id == user.id).first()
        if not work:
            continue
        analysis = (
            db.query(Analysis)
            .filter(Analysis.work_id == wid, Analysis.status == "done")
            .order_by(Analysis.created_at.desc())
            .first()
        )
        if not analysis or not analysis.report_json:
            continue
        r = analysis.report_json
        dims = {}
        for d in (r.get("dimensions") or {}).values():
            dims[str(d["id"])] = {
                "name": d["name"],
                "score": d.get("adjusted_score", d["score"]),
                "tier": d.get("tier_name", ""),
            }
        works_data.append({
            "id": work.id,
            "title": work.title,
            "author": work.author or "",
            "mode": work.mode,
            "wcs": analysis.wcs_score or 0,
            "tier": analysis.tier or "",
            "dimensions": dims,
        })
    return {"ok": True, "works": works_data}


@router.get("/stats")
def works_stats(
    mode: str = "",
    user: User = Depends(get_user),
    db: Session = Depends(get_session),
):
    """Return tier distribution and recent score history for the user's works, optionally filtered by mode."""
    q = (
        db.query(Analysis)
        .join(Work, Analysis.work_id == Work.id)
        .filter(Work.user_id == user.id, Analysis.status == "done", Analysis.wcs_score > 0)
    )
    if mode and mode in ("original", "classic"):
        q = q.filter(Work.mode == mode)
    analyses = q.order_by(Analysis.created_at.desc()).all()

    tierCounts = {}
    scores = []
    for a in analyses:
        t = a.tier or "未评级"
        tierCounts[t] = tierCounts.get(t, 0) + 1
        scores.append({
            "score": round(a.wcs_score, 1) if a.wcs_score else 0,
            "tier": a.tier or "",
            "date": a.created_at.isoformat()[:10] if a.created_at else "",
        })

    # Tier order + color map
    tierColors = {
        "文学之巅": "#b8860b", "永恒殿堂": "#8b0000", "不朽丰碑": "#6b21a8",
        "传世经典": "#2d6a4f", "典范之作": "#1a1a1a",
        "上乘佳作": "#d97706", "中等之作": "#2563eb",
        "准文学级": "#0891b2", "合格文本": "#4f46e5",
        "严重瑕疵": "#dc2626", "缺陷明显": "#f97316",
        "稚嫩习作": "#6b7280", "未评级": "#9ca3af",
    }
    tierOrder = list(tierColors.keys())
    tierDist = [{"tier": t, "count": tierCounts.get(t, 0), "color": tierColors[t]} for t in tierOrder if tierCounts.get(t, 0) > 0]

    return {
        "ok": True,
        "total_analyzed": len(analyses),
        "tier_distribution": tierDist,
        "score_history": scores[:30],
        "tier_colors": tierColors,
    }


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

    # ── Quota check (atomic: single UPDATE per path, no TOCTOU gap) ──
    from datetime import date as _date
    today = _date.today()
    if user.role != "admin":
        # Step 1: Atomic daily refresh (UPDATE with WHERE, idempotent)
        DAILY_LIMIT = {"guest": 3, "user": 5}.get(user.role, 0)
        db.query(User).filter(
            User.id == user.id,
            User.last_quota_refresh == None,  # noqa: E711
        ).update(
            {"daily_quota": DAILY_LIMIT, "last_quota_refresh": today},
            synchronize_session="fetch",
        )
        db.query(User).filter(
            User.id == user.id,
            User.last_quota_refresh < today,
        ).update(
            {"daily_quota": DAILY_LIMIT, "last_quota_refresh": today},
            synchronize_session="fetch",
        )

        # Step 2: Atomic consume — try daily first, then permanent
        result = (
            db.query(User)
            .filter(User.id == user.id, User.daily_quota > 0)
            .update({"daily_quota": User.daily_quota - 1}, synchronize_session="fetch")
        )
        if result == 0:
            result = (
                db.query(User)
                .filter(User.id == user.id, User.permanent_quota > 0)
                .update({"permanent_quota": User.permanent_quota - 1}, synchronize_session="fetch")
            )
        if result == 0:
            role_label = {"guest": "游客", "user": "正式用户"}.get(user.role, "用户")
            raise HTTPException(429, f"{role_label}今日分析次数已用完，永久额度也已耗尽。请通过打赏获取更多次数。")
        db.commit()

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
        user_id=user.id,
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
                        "error_code": "E003",
                        "error_detail": "后端评分计算或数据处理时发生异常，原始 LLM 输出已保存",
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
                    analysis.report_json = {"ok": False, "error": f"报告保存异常: {e}", "error_code": "E004", "error_detail": "报告数据写入数据库失败，可能是磁盘空间不足或数据库锁冲突"}
                    analysis.status = "failed"
                    try:
                        db.commit()
                    except Exception:
                        pass
                return
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
