import logging

from backend.services.calculator import (
    verify_strategy,
    apply_originality_check,
    apply_original_caps,
    apply_defect_exemption,
    compute_wcs,
    layer_for_dim,
    DIMENSION_WEIGHTS,
    calc_tier,
)

logger = logging.getLogger("las.analyzer")


def build_report(raw: dict, mode: str, genre: str) -> dict:
    if not raw.get("ok"):
        logger.warning("LLM 原始结果不可用: %s", raw.get("error", "未知错误"))
        return {
            "ok": False,
            "error": raw.get("error", "LLM analysis failed"),
            "raw_preview": raw.get("raw", "")[:1000],
        }

    dims_raw = raw.get("dimensions", [])
    if not dims_raw:
        return {
            "ok": True,
            "metadata": raw.get("metadata", {}),
            "defect_scan": raw.get("defect_scan", {}),
            "analysis_content": raw.get("analysis_content", {}),
            "dimensions": {},
            "benchmarks": {},
            "lower_bounds": {},
            "scoring": {"wcs": 0, "tier": "严重瑕疵", "layer_avgs": {"A": 0, "B": 0, "C": 0, "D": 0}},
        }

    scores = {d["id"]: d["score"] for d in dims_raw}
    predicted = raw.get("metadata", {}).get("predicted_strategy", 1)

    actual_strategy = verify_strategy(scores, predicted)

    if mode == "original":
        sa = raw.get("scoring_audit", {})
        llm_adjustments = sa.get("originality_adjustments", [])
        scores = apply_originality_check(scores, llm_adjustments if llm_adjustments else None)
        scores = apply_defect_exemption(scores, sa.get("defect_exemptions"))
        scores = apply_original_caps(scores)

    calc = compute_wcs(scores, actual_strategy, mode, genre)

    layer_scores = {"A": [], "B": [], "C": [], "D": []}
    for d in dims_raw:
        lid = layer_for_dim(d["id"])
        layer_scores[lid].append(d["score"])

    layer_avgs = {k: round(sum(v) / len(v), 1) if v else 0 for k, v in layer_scores.items()}

    dims_map = {}
    for d in dims_raw:
        did = d["id"]
        w = DIMENSION_WEIGHTS[did][actual_strategy - 1] / 100.0
        d["weight"] = round(w * 100, 1)
        d["adjusted_score"] = scores.get(did, d["score"])
        d["tier_name"], _ = calc_tier(scores.get(did, d["score"]))
        dims_map[did] = d

    return {
        "ok": True,
        "metadata": {
            "mode": mode,
            "genre": genre,
            "predicted_strategy": predicted,
            "verified_strategy": actual_strategy,
            "genre_keywords": raw.get("metadata", {}).get("genre_keywords", []),
            "spectral_keywords": raw.get("metadata", {}).get("spectral_keywords", []),
        },
        "defect_scan": raw.get("defect_scan", {}),
        "scoring_audit": raw.get("scoring_audit", {}),
        "benchmarks": raw.get("benchmarks", {}),
        "lower_bounds": raw.get("lower_bounds", {}),
        "dimensions": dims_map,
        "analysis_content": raw.get("analysis_content", {}),
        "scoring": {
            "pws": calc["pws"],
            "core_penalty_k": calc["core_penalty_k"],
            "mediocrity_mf": calc["mediocrity_mf"],
            "wcs": calc["wcs"],
            "tier": calc["tier"],
            "badge": calc["badge"],
            "strategy": actual_strategy,
            "layer_avgs": layer_avgs,
        },
    }
