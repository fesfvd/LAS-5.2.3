"""Tests for calculator.py — the scoring engine."""
from backend.services.calculator import (
    layer_for_dim,
    calc_tier,
    verify_strategy,
    apply_originality_check,
    apply_defect_bounds,
    apply_defect_exemption,
    apply_original_caps,
    compute_wcs,
    _is_genre_exempt,
)


class TestLayerForDim:
    def test_layer_a(self):
        for dim in (1, 2, 3, 4):
            assert layer_for_dim(dim) == "A"

    def test_layer_b(self):
        for dim in (5, 6, 7, 8):
            assert layer_for_dim(dim) == "B"

    def test_layer_c(self):
        for dim in (9, 10, 11, 12):
            assert layer_for_dim(dim) == "C"

    def test_layer_d(self):
        for dim in (13, 14, 15, 16):
            assert layer_for_dim(dim) == "D"


class TestCalcTier:
    def test_top_tier(self):
        assert calc_tier(145)[0] == "文学之巅"
        assert calc_tier(140)[0] == "文学之巅"

    def test_boundary_cases(self):
        assert calc_tier(125.0)[0] == "永恒殿堂"
        assert calc_tier(124.9)[0] == "不朽丰碑"
        assert calc_tier(115.0)[0] == "不朽丰碑"
        assert calc_tier(105.0)[0] == "传世经典"

    def test_mid_range(self):
        assert calc_tier(95.0)[0] == "典范之作"
        assert calc_tier(85.0)[0] == "上乘佳作"
        assert calc_tier(75.0)[0] == "准文学级"

    def test_low_range(self):
        assert calc_tier(55.0)[0] == "合格文本"
        assert calc_tier(25.0)[0] == "稚嫩习作"

    def test_zero(self):
        assert calc_tier(0)[0] == "零价值"

    def test_negative(self):
        assert calc_tier(-10)[0] == "零价值"


class TestVerifyStrategy:
    # 16 dims: 1-4=A, 5-8=B, 9-12=C, 13-16=D

    def test_best_layer_a_maps_to_strategy_2(self):
        # Make layer A strongest
        scores = {
            1: 120, 2: 120, 3: 120, 4: 120,  # A high
            5: 60, 6: 60, 7: 60, 8: 60,        # B low
            9: 60, 10: 60, 11: 60, 12: 60,     # C low
            13: 60, 14: 60, 15: 60, 16: 60,    # D low
        }
        assert verify_strategy(scores, 1) == 2

    def test_best_layer_b_maps_to_strategy_3(self):
        scores = {
            1: 60, 2: 60, 3: 60, 4: 60,
            5: 120, 6: 120, 7: 120, 8: 120,  # B high
            9: 60, 10: 60, 11: 60, 12: 60,
            13: 60, 14: 60, 15: 60, 16: 60,
        }
        assert verify_strategy(scores, 1) == 3

    def test_best_layer_c_maps_to_strategy_4(self):
        scores = {
            1: 60, 2: 60, 3: 60, 4: 60,
            5: 60, 6: 60, 7: 60, 8: 60,
            9: 120, 10: 120, 11: 120, 12: 120,  # C high
            13: 60, 14: 60, 15: 60, 16: 60,
        }
        assert verify_strategy(scores, 1) == 4

    def test_best_layer_d_maps_to_strategy_4(self):
        scores = {
            1: 60, 2: 60, 3: 60, 4: 60,
            5: 60, 6: 60, 7: 60, 8: 60,
            9: 60, 10: 60, 11: 60, 12: 60,
            13: 120, 14: 120, 15: 120, 16: 120,  # D high
        }
        assert verify_strategy(scores, 1) == 4


class TestApplyOriginalityCheck:
    def make_scores(self, high_dims=(1, 2, 3, 4), high_val=100, low_val=50):
        """Helper: generate 16-dim scores."""
        s = {}
        for d in range(1, 17):
            s[d] = high_val if d in high_dims else low_val
        return s

    def test_audit_adjusts_top4_above_75(self):
        scores = self.make_scores(high_dims=(1, 2, 5, 9, 13), high_val=80, low_val=50)
        audit = [{"dimension_id": d, "d_value": 1} for d in range(1, 17)]
        result = apply_originality_check(scores, audit)
        # 5 dims ≥75, sorted by score desc, top 4 adjusted
        assert result[1] < 80  # adjusted
        assert result[2] < 80
        assert result[5] < 80
        assert result[9] < 80
        assert result[13] == 80  # 5th high dim, not adjusted

    def test_audit_skips_below_75(self):
        scores = self.make_scores(high_dims=(1,), high_val=74, low_val=50)
        audit = [{"dimension_id": d, "d_value": 1} for d in range(1, 17)]
        result = apply_originality_check(scores, audit)
        assert result[1] == 74  # unchanged, below threshold

    def test_d_value_effect(self):
        scores = self.make_scores(high_dims=(1,), high_val=100, low_val=50)
        # D=3 → ratio 0.729, sub 6 → 100*0.729 - 6 = 66.9
        audit = [{"dimension_id": 1, "d_value": 3}] + [
            {"dimension_id": d, "d_value": 0} for d in range(2, 17)
        ]
        result = apply_originality_check(scores, audit)
        assert result[1] == 66.9
        assert result[2] == 50  # unchanged

    def test_invalid_d_value_falls_back(self):
        scores = self.make_scores(high_dims=(1,), high_val=100, low_val=50)
        audit = [{"dimension_id": 1, "d_value": 99}]  # invalid
        result = apply_originality_check(scores, audit)
        # Falls back to D=1: 100*0.90 - 2 = 88.0
        assert result[1] == 88.0

    def test_unknown_dim_id_skipped(self):
        scores = self.make_scores(high_dims=(1,), high_val=100, low_val=50)
        audit = [{"dimension_id": 99, "d_value": 1}]  # unknown dim
        result = apply_originality_check(scores, audit)
        assert result[1] == 100  # unchanged

    def test_no_audit_fallback(self):
        scores = self.make_scores(high_dims=(1, 2, 3, 4, 5, 6), high_val=80, low_val=50)
        result = apply_originality_check(scores, None)
        # Auto-detect: top 4 ≥75, D=1
        # Score=80, D=1 → 80*0.90 - 2 = 70.0
        for d in (1, 2, 3, 4):
            assert result[d] == 70.0
        assert result[5] == 80  # 5th, not adjusted
        assert result[6] == 80  # 6th, not adjusted

    def test_empty_audit_fallback(self):
        scores = self.make_scores(high_dims=(1,), high_val=80, low_val=50)
        result = apply_originality_check(scores, [])
        assert result[1] == 70.0  # D=1 auto

    def test_no_high_dims_no_adjustment(self):
        scores = self.make_scores(high_dims=(), high_val=70, low_val=50)
        result = apply_originality_check(scores, None)
        for d in range(1, 17):
            assert result[d] == scores[d]  # all unchanged


class TestApplyDefectExemption:
    def test_valid_exemption(self):
        scores = {d: 90 for d in range(1, 17)}
        scores[5] = 80  # weak dim, ≤85
        exemptions = [
            {
                "exempted_dimension_id": 5,
                "linked_to_master_dimension_id": 1,
            }
        ]
        # dim 1 = 90... wait, need master dim ≥105
        scores[1] = 110  # master dim ≥105
        result = apply_defect_exemption(scores, exemptions)
        assert result[5] > 80  # boosted to average

    def test_exemption_rejected_above_85(self):
        scores = {d: 90 for d in range(1, 17)}
        scores[1] = 110
        scores[5] = 86  # >85, should be rejected
        exemptions = [
            {"exempted_dimension_id": 5, "linked_to_master_dimension_id": 1}
        ]
        result = apply_defect_exemption(scores, exemptions)
        assert result[5] == 86  # unchanged

    def test_exemption_rejected_master_below_105(self):
        scores = {d: 90 for d in range(1, 17)}
        scores[1] = 100  # <105
        scores[5] = 80
        exemptions = [
            {"exempted_dimension_id": 5, "linked_to_master_dimension_id": 1}
        ]
        result = apply_defect_exemption(scores, exemptions)
        assert result[5] == 80  # unchanged

    def test_no_exemptions(self):
        scores = {d: 90 for d in range(1, 17)}
        result = apply_defect_exemption(scores, None)
        assert result == scores

    def test_empty_exemptions(self):
        scores = {d: 90 for d in range(1, 17)}
        result = apply_defect_exemption(scores, [])
        assert result == scores

    def test_unknown_dim_skipped(self):
        scores = {d: 90 for d in range(1, 17)}
        exemptions = [
            {"exempted_dimension_id": 99, "linked_to_master_dimension_id": 1}
        ]
        result = apply_defect_exemption(scores, exemptions)
        assert result == scores


class TestApplyOriginalCaps:
    def test_caps_dim15(self):
        scores = {d: 80 for d in range(1, 17)}
        result = apply_original_caps(scores)
        assert result[15] == 60

    def test_caps_dim16(self):
        scores = {d: 80 for d in range(1, 17)}
        result = apply_original_caps(scores)
        assert result[16] == 60

    def test_no_cap_if_below_60(self):
        scores = {d: 50 for d in range(1, 17)}
        result = apply_original_caps(scores)
        assert result[15] == 50
        assert result[16] == 50


class TestComputeWCS:
    def test_basic_pws(self):
        scores = {d: 100 for d in range(1, 17)}
        result = compute_wcs(scores, strategy=1, mode="classic", genre="novel")
        # PWS = sum(100 * weight) ≈ 100 (all scores equal, weighted sum = 100)
        assert abs(result["pws"] - 100) < 1
        assert result["wcs"] == result["pws"]  # no penalties for classic
        assert result["core_penalty_k"] == 1.0
        assert result["mediocrity_mf"] == 1.0

    def test_original_mode_no_penalties_when_balanced(self):
        scores = {d: 85 for d in range(1, 17)}
        result = compute_wcs(scores, strategy=1, mode="original", genre="novel")
        # mean_14 = 85 (>65), core balanced → no penalties
        assert result["core_penalty_k"] == 1.0
        assert result["mediocrity_mf"] == 1.0

    def test_bias_penalty_triggered(self):
        scores = {d: 60 for d in range(1, 17)}
        # Make core dims (1,5,9,13) weak compared to non-core
        for d in (1, 5, 9, 13):
            scores[d] = 55
        # Non-core dims higher
        for d in (2, 3, 4, 6, 7, 8, 10, 11, 12, 14):
            scores[d] = 75
        result = compute_wcs(scores, strategy=1, mode="original", genre="novel")
        # core_avg = 55, noncore_avg = 75, gap = 20, core_avg <= 90 → k triggered
        assert result["core_penalty_k"] < 1.0
        assert result["wcs"] < result["pws"]

    def test_mediocrity_penalty_triggered(self):
        scores = {d: 50 for d in range(1, 17)}  # mean_14 = 50 (<65), sd ≈ 0 (≤8)
        result = compute_wcs(scores, strategy=1, mode="original", genre="novel")
        assert result["mediocrity_mf"] < 1.0
        assert result["wcs"] < result["pws"]

    def test_bias_exempt_genre(self):
        scores = {d: 60 for d in range(1, 17)}
        for d in (1, 5, 9, 13):
            scores[d] = 55
        for d in (2, 3, 4, 6, 7, 8, 10, 11, 12, 14):
            scores[d] = 75
        result = compute_wcs(scores, strategy=1, mode="original", genre="诗歌")
        assert result["core_penalty_k"] == 1.0  # exempt

    def test_penalty_lower_bounds(self):
        # Test k lower bound 0.65
        scores = {d: 80 for d in range(1, 17)}
        for d in (1, 5, 9, 13):
            scores[d] = 10  # huge gap
        result = compute_wcs(scores, strategy=1, mode="original", genre="novel")
        assert result["core_penalty_k"] >= 0.65

    def test_classic_mode_no_penalties(self):
        scores = {d: 40 for d in range(1, 17)}  # would trigger mediocrity in original
        result = compute_wcs(scores, strategy=1, mode="classic", genre="novel")
        assert result["core_penalty_k"] == 1.0
        assert result["mediocrity_mf"] == 1.0


class TestIsGenreExempt:
    def test_exact_match(self):
        assert _is_genre_exempt("诗歌") is True
        assert _is_genre_exempt("小说") is False

    def test_parenthetical_chinese(self):
        assert _is_genre_exempt("诗歌（抒情/意象/口语/具象/短诗）") is True
        assert _is_genre_exempt("先锋小说（语言实验/意识流）") is True

    def test_parenthetical_english(self):
        assert _is_genre_exempt("诗歌(抒情)") is True

    def test_non_exempt_with_parens(self):
        assert _is_genre_exempt("小说（长篇）") is False

    def test_edge_spaces(self):
        assert _is_genre_exempt("  诗歌  ") is True


class TestApplyDefectBounds:
    def test_clamps_score_to_bound(self):
        scores = {1: 80, 2: 60, 3: 70}
        audit = [
            {"dimension_id": 1, "defect_bound": 55},
            {"dimension_id": 2, "defect_bound": None},
        ]
        result = apply_defect_bounds(scores, audit)
        assert result[1] == 55
        assert result[2] == 60  # unchanged (no bound)

    def test_null_bound_skipped(self):
        scores = {1: 80}
        audit = [{"dimension_id": 1, "defect_bound": None}]
        result = apply_defect_bounds(scores, audit)
        assert result[1] == 80

    def test_string_null_bound_skipped(self):
        scores = {1: 80}
        audit = [{"dimension_id": 1, "defect_bound": "null"}]
        result = apply_defect_bounds(scores, audit)
        assert result[1] == 80

    def test_no_audit(self):
        scores = {1: 80}
        result = apply_defect_bounds(scores, None)
        assert result[1] == 80

    def test_score_below_bound_unchanged(self):
        scores = {1: 40}
        audit = [{"dimension_id": 1, "defect_bound": 55}]
        result = apply_defect_bounds(scores, audit)
        assert result[1] == 40

    def test_unknown_dim_skipped(self):
        scores = {1: 80}
        audit = [{"dimension_id": 99, "defect_bound": 55}]
        result = apply_defect_bounds(scores, audit)
        assert result[1] == 80
