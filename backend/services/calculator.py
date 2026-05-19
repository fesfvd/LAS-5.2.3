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

BIAS_EXEMPT_GENRES = {"诗歌", "骈文", "赋", "先锋小说", "新兴语言实验文本", "议论性文体", "哲学散文", "碎片化思辨文本"}


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
    strategy_map = {"A": 2, "B": 3, "C": 4, "D": 1}
    return strategy_map.get(best, predicted_strategy)


def apply_originality_check(scores: dict, adjustments: list | None = None) -> dict:
    """Apply originality penalty to high-scoring dimensions in original mode.

    If `adjustments` is provided (from LLM's scoring_audit.originality_adjustments),
    each entry's d_value is used for the corresponding dimension.
    Otherwise falls back to auto-detection with D=1 (medium deviation) for
    backward compatibility with V1 prompts.
    """
    GAP_RATIOS = {0: 1.0, 0.5: 0.9487, 1: 0.90, 2: 0.81, 3: 0.729}
    SUBS = {0: 0, 0.5: 1, 1: 2, 2: 4, 3: 6}
    adjusted = dict(scores)

    if adjustments:
        for adj in adjustments:
            dim_id = adj.get("dimension_id")
            d_val = adj.get("d_value", 1)
            if dim_id is None or dim_id not in scores:
                continue
            if d_val not in GAP_RATIOS:
                logger.warning(f"apply_originality_check: 非标准 D 值 d_value={d_val!r} (dim={dim_id})，已回退为 D=1")
            d_val = d_val if d_val in GAP_RATIOS else 1
            original = scores[dim_id]
            new = round(original * GAP_RATIOS[d_val] - SUBS[d_val], 1)
            adjusted[dim_id] = max(new, 0)
        return adjusted

    # Fallback: auto-detect (V1 compatible) — always uses D=1
    high_dims = [(k, v) for k, v in sorted(scores.items(), key=lambda x: -x[1]) if v >= 75]
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
        dim_id = ex.get("exempted_dimension_id")
        if dim_id is None or dim_id not in result:
            continue
        # Verify pre-condition: exempted dim must be ≤85
        if result[dim_id] > 85:
            logger.warning("apply_defect_exemption: dim %d score %.1f > 85, 驳回豁免", dim_id, result[dim_id])
            continue
        # Verify pre-condition: linked master dim must be ≥105
        master_id = ex.get("linked_to_master_dimension_id")
        if master_id is None or master_id not in result or result[master_id] < 105:
            logger.warning("apply_defect_exemption: master dim %d score %.1f < 105, 驳回豁免", master_id or 0, result.get(master_id, 0))
            continue

        others = [v for k, v in result.items() if k != dim_id]
        avg = sum(others) / len(others) if others else result[dim_id]
        logger.info("apply_defect_exemption: 正缺陷豁免 dim %d (%.1f→%.1f) via master dim %d (%.1f)",
                    dim_id, result[dim_id], round(avg, 1), master_id, result[master_id])
        result[dim_id] = round(avg, 1)
        exempted_count += 1

    return result


def apply_original_caps(scores: dict) -> dict:
    """Enforce dimension 15/16 cap at 60 for original mode (潜质估算法)."""
    result = dict(scores)
    for dim_id in (15, 16):
        if dim_id in result and result[dim_id] > 60:
            logger.info("apply_original_caps: dim %d capped %.1f → 60", dim_id, result[dim_id])
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
        if genre not in BIAS_EXEMPT_GENRES and core_avg <= 90 and gap > 5:
            k = 1.0 / (1.0 + 0.01 * gap)
            k = max(k, 0.65)

    wcs = pws * k

    mf = 1.0
    if mode == "original":
        vals_14 = [scores[d] for d in range(1, 15)]
        mean_14 = sum(vals_14) / 14
        sd_14 = math.sqrt(sum((v - mean_14) ** 2 for v in vals_14) / 14) if vals_14 else 0
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
