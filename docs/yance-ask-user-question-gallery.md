# Ask User Question by Yance: Desktop gallery

English | [简体中文](yance-ask-user-question-gallery_zh.md)

Maintainer **Yance** supplied these six original Desktop screenshots on 2026-10-15
and confirmed that, after restarting, Details showed **0.1.5** and the
recommendation highlight, icon and display order worked. See the
[validation record](validation/yance-ask-user-question-0.1.5.md) for the
separate artifact and test evidence. The screenshots are copied without
cropping or image changes; this gallery is outside the runtime ZIP.

Green treatment with a star/Recommended badge identifies an explicit
recommendation. Orange is the ordinary selected state and alone does not
identify a recommendation. Screenshots capture the visible state, not
every transition, raw answer metadata or the original parameter order.
Version attribution includes the maintainer's restart/Details confirmation;
the version is not independently visible in every screenshot.

## 1. Dark theme: ordinary single-choice selection

The selected destination is orange, with no recommendation badge. This
is a single-choice selected state, not proof of a recommended option.

![Dark Desktop single-choice question with an ordinary orange selected option](images/yance-ask-user-question/0.1.5/dark-single-choice-selected.png)

## 2. Dark theme: multiple options selected

All four listed options are selected together in a multiple-choice
question. Their orange appearance indicates selection; this screenshot
does not show a separate select-all command or recommendation badges.

![Dark Desktop multiple-choice question with all four options selected](images/yance-ask-user-question/0.1.5/dark-multiple-choice-all-selected.png)

## 3. Dark theme: recommendation before selection

The first displayed option has a star, a localized Recommended badge and
green treatment. No option is selected and Next is disabled. The image
shows the recommendation presentation; raw parameter order is collapsed.

![Dark Desktop recommended option with green treatment before selection](images/yance-ask-user-question/0.1.5/dark-recommended-unselected.png)

## 4. Light theme: a long question

The question wraps across lines while its options and navigation remain
visible at the captured window size. The orange option is selected and
has no recommendation badge. This does not establish every viewport size.

![Light Desktop long question with visible options and navigation](images/yance-ask-user-question/0.1.5/light-long-question-selected.png)

## 5. Light theme: one question ready to submit

One option is selected and Submit answer is enabled. This captures the
ready-to-submit state, not the completed submission or its returned data.

![Light Desktop single-question form with Submit answer enabled](images/yance-ask-user-question/0.1.5/light-single-question-submit.png)

## 6. Light theme: recommendation without preselection

The first displayed option has green treatment, a star and the Recommended
badge; no choice is selected and Submit answer is disabled.

![Light Desktop recommendation with no selected answer](images/yance-ask-user-question/0.1.5/light-recommended-unselected.png)

## Checking an upgrade or restart

The plugin-management API version describes the installed package. An
already open Chat page can still have an older frontend loaded. Check
Details on the actual question card to identify the executing UI version.
If they differ, finish or decline pending questions, refresh Console and
begin a new conversation. For source-launched Desktop, close the window,
wait for the launch command to exit and restart it. Reinitializing the
Agent/model configuration is unnecessary.

The accepted ZIP remains unchanged, including candidate wording written
when it was packed. The external validation record and this follow-up
gallery document the later maintainer acceptance. Its version source is maintained in this repository; no GitHub Release
or marketplace publication is claimed.

## Original file checksums

| Gallery file                            | Original filename               | SHA-256                                                            |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `dark-single-choice-selected.png`       | `Screenshot_20261015170457.png` | `236aaeb32e23e59ee118de6f21c2ea3cc1e2e3593c3aa59622157f2bc11f1d44` |
| `dark-multiple-choice-all-selected.png` | `Screenshot_20261015170518.png` | `900e77fae2fb2f6df4e2a099e11de665dec616882830a1a6257baa5b0a57d396` |
| `dark-recommended-unselected.png`       | `Screenshot_20261015170713.png` | `544a946a76888ab5678e09befac47110de63e6b05b196235dbedbb5b8ec8a6ee` |
| `light-long-question-selected.png`      | `Screenshot_20261015170832.png` | `c7bdccdad7c05a2c057aad164e2f191b24205960280ccfc781d6a3305190766e` |
| `light-single-question-submit.png`      | `Screenshot_20261015170853.png` | `c2352939114d8426d1397da712a6c551b5b65852ec6e5b2d27e53f66dc86189c` |
| `light-recommended-unselected.png`      | `Screenshot_20261015171018.png` | `5f12ea7e8e8901955e9f6b96d6edb8ecfb1d90c4af47088930294c415c5f2fba` |
