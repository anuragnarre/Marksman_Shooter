🎯 **What:** Added tests for `detect_holes` and helper functions in `hole_detector.py` since they were entirely uncovered.

📊 **Coverage:** Tested public `detect_holes` functionality (including a full run with synthetic image generation) as well as internal heuristics functions `_has_radial_gradient`, `_deduplicate`, `_find_saddle_splits`, and `_filter_ring_artifacts`.

✨ **Result:** Increased unit test coverage in the vision pipeline, safeguarding the core detection logic against future regressions.
