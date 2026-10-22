---
title: "Gaussian See, Gaussian Do: Semantic 3D Motion Transfer from Multiview Video"
short: "GSGD"
authors: "Yarin Bekor, Gal Michael Harari, Or Perel, Or Litany"
venue: "SIGGRAPH Asia"
year: 2025
field: "Character animation"
topic: "Motion transfer"
approach: "Embedding inversion"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2511.14848"
  project: "https://gsgd-motiontransfer.github.io"
  code: ""
  video: ""
read_date: 2026-01-09
tags: [motion-transfer, 3d-gaussian-splatting, video-diffusion, condition-inversion, 4d-reconstruction]
---

## 한 줄 요약

multiview video에서 video diffusion(SVD)의 condition inversion으로 motion embedding을 뽑고, 이를 rig 없는 정적 3DGS 대상의 렌더링에 적용해 만든 supervision video로 dynamic 3DGS를 재구성하여, 말이 앞발을 드는 동작을 자동차가 앞바퀴를 드는 동작으로 옮기는 식의 범주 간(semantic) 3D motion transfer를 하는 방법.

## 요약

3D motion retargeting은 대부분 rig이 있는 사람/동물에 한정되고, 2D video의 semantic motion transfer(motion embedding inversion)는 3D로 확장되지 않았다. 이 논문은 source 물체의 multiview video를 입력으로, 구조가 전혀 다른 정적 3DGS target에 의미가 통하는 motion을 입히는 새 문제를 정의한다. 단순히 view마다 embedding을 따로 inversion하면 다른 각도에 일반화되지 않아서, K개의 anchor embedding을 시야각 위에 두고 slerp로 보간하며 함께 최적화한다(view-aware motion embedding). 이 embedding과 target 렌더링으로 SVD가 만든 supervision video는 noise가 많고 view 간 일관성이 없으므로, SC-GS식 control point 기반 4D 재구성에 ARAP Rotation과 LPIPS loss를 더해 안정화한다. 처음으로 이 task용 benchmark(Mini-Mixamo, Cross-Category)를 만들고, 각색한 SC4D·DreamGaussians4D보다 Motion Fidelity와 CLIP 지표가 모두 높다고 보고한다.

## 핵심 정리

- 배경: Kansy et al.(Reenact Anything)의 관찰처럼 image-to-video diffusion에서 image 입력은 외형을, 추가 embedding 입력은 motion을 주로 결정한다. 이 embedding을 source video에 대해 score matching loss로 최적화(condition inversion)하면 motion만 담은 표현을 얻는다.
- Structured Multiview Motion Inversion: 시야각에 고르게 놓인 K개 anchor embedding을 두고, 학습 때 각도 φ의 video를 뽑아 가장 가까운 두 anchor를 slerp한 embedding으로 loss를 계산. 한 번의 backward로 여러 anchor가 같이 갱신되어 수렴이 빨라진다.
- View-aware transfer: 무작위 카메라로 target 3DGS를 렌더링하고, 그 각도에 맞게 보간한 embedding으로 SVD를 돌려 target supervision video를 생성.
- 4D Consolidation: target 위 control point 512개(FPS 초기화)를 MLP 변형장이 움직이고 LBS로 Gaussian을 변형. supervision이 불안정하므로
  - ARAP Rotation: MLP가 예측한 control point 회전 대신 ARAP 최적 회전으로 바꿔 학습 중에 강제(보통은 후처리로만 쓰는 제약).
  - pixel-wise loss 대신 LPIPS loss로 view 불일치에 덜 민감하게.
  - SDS나 Iterative Dataset Update도 시도했지만 성능이 낮거나 시간이 크게 늘어(1시간 vs 5분) 제외.
- 설정: anchor 5개, 입력 view 16개, inversion 3K step, 4D 재구성 5K iteration, backbone은 SVD img2vid.
- 비교(Table 1): Motion Fidelity Mini-Mixamo 0.74 / Cross-Category 0.66 (SC4D 0.65/0.56, DG4D 0.61/0.54). CLIP-I, CLIP Score도 가장 높음.
- User study: 외형 충실도 평균 4.66/5로 가장 높고, motion 품질은 SC4D와 비슷하며 DG4D보다 높음.
- Novel-view motion synthesis(Table 2): 학습 때 안 본 각도에서 LPIPS 0.0403로, 단순 view별 embedding(0.1058)이나 global embedding 하나(0.0649)보다 좋다. anchor 개수 ablation에서 K=1(global)은 좌우가 반대로 보이는 view를 섞어 hallucination이 생김.

## 흥미로운 점

- 2D video diffusion의 motion prior를 3D 애니메이션으로 끌어올리는 경로(embedding inversion → 2D supervision → 4D 재구성)가 깔끔하다. rig나 skeleton 대응 없이 날개 퍼덕임을 코끼리 귀에 옮기는 식의 semantic 대응이 생긴다.
- anchor + slerp 구조가 단순히 속도를 높이려던 것인데, 처음 보는 시야각의 embedding도 만들어 내는 성질이 생겼다는 점.
- 날개 동작처럼 비표준 구조의 motion을 rig 없이 다른 형태로 옮기는 데 참고할 수 있다.

## 한계와 의문

- condition inversion 비용이 커서 실행 시간이 여전히 문제다(저자 언급).
- 3D semantic motion을 제대로 재는 지표가 없어 2D Motion Fidelity와 CLIP 계열로 평가한다. 이 지표가 "의미가 맞는 motion"을 충분히 반영할까?
- multiview source video가 필요하다. 단일 view 영상만 있을 때는 어떻게 할까?
- SVD가 생성한 supervision에 의존하므로, motion 길이·해상도도 SVD의 한계(짧은 clip)에 묶이는 것 아닌가?

## 나의 한마디
{: .mine-title}
