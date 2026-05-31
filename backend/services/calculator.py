import math
import logging

logger = logging.getLogger(__name__)

STRATEGY_WEIGHTS = {
    1: {"A": 0.25, "B": 0.35, "C": 0.25, "D": 0.15},
    2: {"A": 0.40, "B": 0.25, "C": 0.20, "D": 0.15},
    3: {"A": 0.15, "B": 0.40, "C": 0.25, "D": 0.20},
    4: {"A": 0.12, "B": 0.18, "C": 0.45, "D": 0.25},
}

DIMENSION_WEIGHTS = {
    1: [6.25, 10.0, 3.8, 3.0],
    2: [6.25, 10.0, 3.8, 3.0],
    3: [6.25, 10.0, 3.8, 3.0],
    4: [6.25, 10.0, 3.8, 3.0],
    5: [10.0, 7.1, 11.4, 5.1],
    6: [10.0, 7.1, 11.4, 5.1],
    7: [10.0, 7.1, 11.4, 5.1],
    8: [5.0, 3.7, 5.6, 2.7],
    9: [8.33, 6.7, 8.3, 15.0],
    10: [8.33, 6.7, 8.3, 15.0],
    11: [4.17, 3.3, 4.2, 7.5],
    12: [4.17, 3.3, 4.2, 7.5],
    13: [5.0, 5.0, 6.7, 8.3],
    14: [5.0, 5.0, 6.7, 8.3],
    15: [2.5, 2.5, 3.3, 4.2],
    16: [2.5, 2.5, 3.3, 4.2],
}

TIER_MAP = [
    (140, "文学之巅", "👑"),
    (125, "永恒殿堂", "🏆"),
    (115, "不朽丰碑", "🏛️"),
    (105, "传世经典", "📜"),
    (95, "典范之作", "⭐"),
    (85, "上乘佳作", "✨"),
    (75, "准文学级", "📚"),
    (65, "中等之作", "🎯"),
    (55, "合格文本", "✅"),
    (45, "严重瑕疵", "⚠️"),
    (35, "缺陷明显", "🔻"),
    (25, "稚嫩习作", "🌱"),
    (15, "基础薄弱", "📉"),
    (5, "完全失效", "❌"),
    (0, "零价值", "∅"),
]

BIAS_EXEMPT_GENRES = {
    "诗歌",
    "骈文",
    "赋",
    "先锋小说",
    "新兴语言实验文本",
    "议论性文体",
    "哲学散文",
    "碎片化思辨文本",
}


def _is_genre_exempt(genre: str) -> bool:
    """Check if genre is in the exemption list using prefix matching.

    LLM may output genre with parenthetical subtypes (e.g. "诗歌（抒情/意象）"
    or "先锋小说（语言实验/意识流）"), while BIAS_EXEMPT_GENRES stores only
    base names. This function strips the parenthetical to match correctly.
    """
    base = genre.split("（")[0].split("(")[0].strip()
    return base in BIAS_EXEMPT_GENRES


def _safe_dim_id(val) -> int | None:
    """Coerce LLM's dimension_id to int, logging type mismatches."""
    if val is None:
        return None
    if isinstance(val, int):
        return val
    try:
        return int(val)
    except (ValueError, TypeError):
        logger.warning("维度 ID 类型异常，无法转换为 int: %r", val)
        return None


def layer_for_dim(dim_id: int) -> str:
    if dim_id <= 4:
        return "A"
    if dim_id <= 8:
        return "B"
    if dim_id <= 12:
        return "C"
    return "D"


def calc_tier(score: float):
    for threshold, name, badge in TIER_MAP:
        if score >= threshold:
            return name, badge
    return "零价值", "∅"


def verify_strategy(scores: dict, predicted_strategy: int) -> int:
    layer_avgs = {}
    for layer in ["A", "B", "C", "D"]:
        dims = [v for k, v in scores.items() if layer_for_dim(k) == layer]
        layer_avgs[layer] = sum(dims) / len(dims) if dims else 0
    best = max(layer_avgs, key=layer_avgs.get)
    strategy_map = {"A": 2, "B": 3, "C": 4, "D": 4}
    return strategy_map.get(best, predicted_strategy)


def apply_originality_check(scores: dict, dimension_audit: list | None = None) -> dict:
    """Apply originality penalty in original mode.

    LLM provides a `dimension_audit` array with d_value for all 16 dimensions.
    Backend decides WHICH dimensions to adjust:
      - Filter: only dimensions with original score >= 75
      - Sort by score descending
      - Take top 4 (1调1, 2调2, 3调3, 4调4, >4取最高4)
      - Apply formula: new = round(original * GAP_RATIOS[d] - SUBS[d], 1)

    Falls back to auto-detection with D=1 for backward compatibility (V1 prompts).
    """
    GAP_RATIOS = {0: 1.0, 0.5: 0.9487, 1: 0.90, 2: 0.81, 3: 0.729}
    SUBS = {0: 0, 0.5: 1, 1: 2, 2: 4, 3: 6}
    adjusted = dict(scores)

    if dimension_audit:
        # Build dim_id → d_value map from LLM's 16-dimension audit
        d_map = {}
        for entry in dimension_audit:
            dim_id = _safe_dim_id(entry.get("dimension_id"))
            d_val = entry.get("d_value")
            if d_val is None:
                d_val = 1
            if dim_id is not None and dim_id in scores:
                if d_val not in GAP_RATIOS:
                    logger.warning(
                        f"apply_originality_check: 非标准 D 值 d_value={d_val!r} (dim={dim_id})，已回退为 D=1"
                    )
                    d_val = 1
                d_map[dim_id] = d_val
            elif dim_id is not None:
                logger.warning(
                    f"apply_originality_check: dimension_audit 包含未知维度 id={dim_id!r}，已跳过"
                )

        # Backend decides: filter >= 75, sort by score desc, take top 4
        eligible = [
            (dim_id, scores[dim_id]) for dim_id in d_map if scores[dim_id] >= 75
        ]
        eligible.sort(
            key=lambda x: (-x[1], x[0])
        )  # score desc, then dim_id asc for tie-breaking
        to_adjust = eligible[:4]

        for dim_id, original in to_adjust:
            d_val = d_map[dim_id]
            new = round(original * GAP_RATIOS[d_val] - SUBS[d_val], 1)
            adjusted[dim_id] = max(new, 0)
        return adjusted

    # Fallback: auto-detect (V1 compatible) — always uses D=1
    high_dims = [
        (k, v) for k, v in sorted(scores.items(), key=lambda x: -x[1]) if v >= 75
    ]
    if not high_dims:
        return adjusted
    to_adjust = min(len(high_dims), 4)
    for dim_id, original in high_dims[:to_adjust]:
        new = round(original * GAP_RATIOS[1] - SUBS[1], 1)
        adjusted[dim_id] = max(new, 0)
    return adjusted


def apply_defect_exemption(scores: dict, exemptions: list | None = None) -> dict:
    """Apply defect exemptions based on LLM's three-factor judgment.

    Unlike the old mechanical rule, this trusts the LLM's scoring_audit.defect_exemptions
    which already performed 因果必然性/不可规避性/内在一贯性 analysis.
    Without LLM-approved exemptions, no exemption is applied.
    """
    result = dict(scores)
    if not exemptions:
        return result

    exempted_count = 0
    for ex in exemptions:
        if exempted_count >= 4:
            break
        dim_id = _safe_dim_id(ex.get("exempted_dimension_id"))
        if dim_id is None or dim_id not in result:
            continue
        # Verify pre-condition: exempted dim must be ≤85
        if result[dim_id] > 85:
            logger.warning(
                "apply_defect_exemption: dim %d score %.1f > 85, 驳回豁免",
                dim_id,
                result[dim_id],
            )
            continue
        # Verify pre-condition: linked master dim must be ≥105
        master_id = _safe_dim_id(ex.get("linked_to_master_dimension_id"))
        if master_id is None or master_id not in result or result[master_id] < 105:
            logger.warning(
                "apply_defect_exemption: master dim %d score %.1f < 105, 驳回豁免",
                master_id or 0,
                result.get(master_id, 0),
            )
            continue

        others = [v for k, v in result.items() if k != dim_id]
        avg = sum(others) / len(others) if others else result[dim_id]
        logger.info(
            "apply_defect_exemption: 正缺陷豁免 dim %d (%.1f→%.1f) via master dim %d (%.1f)",
            dim_id,
            result[dim_id],
            round(avg, 1),
            master_id,
            result[master_id],
        )
        result[dim_id] = round(avg, 1)
        exempted_count += 1

    return result


def apply_defect_bounds(scores: dict, dimension_audit: list | None = None) -> dict:
    """Enforce defect binding upper limits (≤55 or ≤60) from LLM's audit.

    Prompt requires LLM to cap scores for defect-bound dimensions, but this
    is a safety net in case the LLM fails to self-enforce the constraint.
    """
    if not dimension_audit:
        return dict(scores)
    result = dict(scores)
    for entry in dimension_audit:
        dim_id = _safe_dim_id(entry.get("dimension_id"))
        bound = entry.get("defect_bound")
        if dim_id is None or dim_id not in result:
            continue
        if bound is None:
            continue
        if isinstance(bound, str) and bound.strip().lower() in ("null", "none", ""):
            continue
        try:
            bound = float(bound)
        except (ValueError, TypeError):
            continue
        if result[dim_id] > bound:
            logger.info(
                "apply_defect_bounds: dim %d %.1f clamped to %.0f (defect bound)",
                dim_id, result[dim_id], bound,
            )
            result[dim_id] = bound
    return result


def apply_original_caps(scores: dict) -> dict:
    """Enforce dimension 15/16 cap at 60 for original mode (潜质估算法)."""
    result = dict(scores)
    for dim_id in (15, 16):
        if dim_id in result and result[dim_id] > 60:
            logger.info(
                "apply_original_caps: dim %d capped %.1f → 60", dim_id, result[dim_id]
            )
            result[dim_id] = 60.0
    return result


def compute_wcs(scores: dict, strategy: int, mode: str, genre: str) -> dict:
    dim_weights = {}
    for dim_id in range(1, 17):
        w = DIMENSION_WEIGHTS[dim_id][strategy - 1] / 100.0
        dim_weights[dim_id] = w

    pws = sum(scores[d] * dim_weights[d] for d in range(1, 17))

    k = 1.0
    if mode == "original":
        core_ids = {1, 5, 9, 13}
        core_avg = sum(scores[d] for d in core_ids) / 4
        noncore_dims = [d for d in range(1, 15) if d not in core_ids]
        noncore_avg = sum(scores[d] for d in noncore_dims) / len(noncore_dims)
        gap = abs(core_avg - noncore_avg)
        # 偏科惩罚: k = 1/(1 + 0.01×gap)，gap>5 且核心≤90 时触发；k 下界 0.65
        if not _is_genre_exempt(genre) and core_avg <= 90 and gap > 5:
            k = 1.0 / (1.0 + 0.01 * gap)
            k = max(k, 0.65)

    wcs = pws * k

    mf = 1.0
    if mode == "original":
        vals_14 = [scores[d] for d in range(1, 15)]
        mean_14 = sum(vals_14) / 14
        sd_14 = (
            math.sqrt(sum((v - mean_14) ** 2 for v in vals_14) / 14) if vals_14 else 0
        )
        # 平庸惩罚: mf = 1 - 0.006×(75 - mean)，mean<65 且 sd≤8 时触发；mf 下界 0.75
        if mean_14 < 65 and sd_14 <= 8:
            mf = 1.0 - 0.006 * (75 - mean_14)
            mf = max(mf, 0.75)

    wcs = wcs * mf
    tier, badge = calc_tier(wcs)

    return {
        "pws": round(pws, 1),
        "core_penalty_k": round(k, 4),
        "mediocrity_mf": round(mf, 4),
        "wcs": round(wcs, 1),
        "tier": tier,
        "badge": badge,
        "strategy": strategy,
    }
