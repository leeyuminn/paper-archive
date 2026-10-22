---
title: "VQ-Style: Disentangling Style and Content in Motion with Residual Quantized Representations"
short: "VQ-Style"
authors: "Fatemeh Zargarbashi, Dhruv Agrawal, Jakob Buhmann, Martin Guay, Stelian Coros, Robert W. Sumner"
venue: "Eurographics"
year: 2026
field: "Character animation"
topic: "Motion style transfer"
approach: "Residual VQ"
links:
  paper: ""
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [style-transfer, rvq-vae, disentanglement, contrastive-learning, motion-representation]
---

## 한 줄 요약

RVQ-VAE의 coarse-to-fine 구조를 이용해 첫 codebook에는 content, 뒤쪽 residual codebook에는 style이 담기도록 학습한다. inference 때 codebook을 바꿔 끼우기만 하는 Quantized Code Swapping으로, fine-tuning 없이 unseen style까지 motion style transfer를 한다.

## 요약

motion style transfer를 하려면 content(무엇을 하는가)와 style(어떻게 하는가)을 분리해야 하는데, 둘의 경계가 모호해 어렵다. 저자들은 "content는 coarse한 구조, style은 fine한 디테일"이라는 관점에서, random한 개수의 codebook만으로 reconstruction하도록 RVQ-VAE를 학습해 계층적 표현을 얻는다. 여기에 두 가지 loss를 더한다. 하나는 뒤쪽(style) codebook의 residual embedding에만 거는 style label 기반 contrastive loss이고, 다른 하나는 content code와 style label 사이의 mutual information을 최소화해 style leakage를 막는 loss이다. inference에서는 content clip의 앞쪽 code와 style clip의 뒤쪽 code를 합쳐 decode하면 style transfer가 된다. 같은 표현으로 style 제거, interpolation, transition, inversion, motion blending, data augmentation도 할 수 있다. adversarial이나 cycle-consistency 학습 없이도 100STYLE, Aberman, Xia 데이터셋에서 baseline보다 높은 style accuracy를 보였다.

## 핵심 정리

- **표현**: 1D conv encoder/decoder 구조의 RVQ-VAE. 학습 때 앞쪽 n개 codebook만 무작위로 써서 reconstruction하기 때문에 초기 codebook에 coarse 정보가 모인다. state는 joint별 local position, 6D orientation, 선속도·각속도, root height, up direction으로 구성된다. codebook은 8개 × 512 code를 쓴다(Aberman 데이터셋에서는 4개 × 256). Appendix에 따르면 codebook을 늘릴수록 reconstruction error가 줄지만, 개선 폭은 점점 작아진다.
- **Loss**: weighted reconstruction, FK loss, velocity loss, acceleration 정규화, 그리고 commitment loss와 EMA codebook update, 안 쓰이는 code reset.
- **Contrastive loss(Multi-Pos)**: 양자화 이후 residual embedding에 적용한다. straight-through gradient 성질 때문에 이 loss가 앞쪽(content) codebook의 gradient에는 영향을 주지 않는다는 점을 유도로 보인다. EMA가 미분 불가능하므로 backprop 이후 두 번째 update 단계로 EMA를 적용하도록 설계했다.
- **Mutual information loss**: content code와 style label 사이의 MI를 Monte-Carlo로 추정해 최소화한다. 이때 hard assignment 대신 softmax 기반 soft assignment를 쓴다.
- **Code swapping cut-off**: s=1(첫 codebook만 content)이 적절했다. s=2로 하면 content가 거의 그대로 복제되어 두 번째 codebook에 style 대부분이 들어 있음을 보여준다. style code를 더 많이 쓰면 foot sliding 같은 artifact가 줄어든다.
- **정량 결과**:
  - 100STYLE, LPN-Style(MSK22)과 비교: test top-1 style accuracy 83.20%(LPN-Style 73.24%, 깨진 8개 style 제외 시 77.53%). unseen style은 68.95% top-1, 98.83% top-5인데 LPN-Style은 zero-shot이 불가능하다. 둘 다 fine-tune하면 96.88% vs 86.92%.
  - Aberman과 Xia, GenMoStyle과 비교: style accuracy는 Ours가 전부 높다(Test 80.91 vs 76.02, Xia 53.85 vs 30.77). content error는 GenMoStyle이 더 낮다(Test 0.019 m vs 0.029 m). cross-classification(content의 style로 오분류되는 비율)은 Ours가 더 낮다(Test 5.10% vs 8.16%).
  - Ablation: 기본 RVQ는 style accuracy 55.86%. contrastive loss만 넣으면 68.95%, MI loss만 넣으면 73.24%, 둘 다 넣으면 87.50%. reconstruction error 차이는 표준편차 범위 안이다.

## 흥미로운 점

- 별도의 style/content encoder 없이 residual quantization의 계층 구조 자체를 disentanglement에 쓴다는 발상이 단순하면서도 효과적이다.
- style code를 빼면 "반대 style"이 나온다(ArmsFolded를 빼면 팔이 벌어지고, PigeonToed를 빼면 DuckFeet). latent가 직관적으로 해석 가능하다는 증거로 흥미롭다.
- 시간축을 따라 서로 다른 clip의 style code를 이어 붙이면 학습 때 본 적 없는 style transition이 생긴다. 무작위 style code로 data augmentation을 할 수 있다.
- 같은 그룹(DisneyResearch|Studios, ETH)의 Two2Four, GMR과 함께 보면 motion representation과 툴 연구 흐름이 연결된다.

## 한계와 의문

- 저자들이 밝힌 한계: content와 style의 정의가 데이터셋마다 다르다(kicking이 Aberman에서는 content, 100STYLE에서는 style). 실제로는 style label이 분리 기준을 좌우한다. root trajectory error 같은 지표는 Drunk처럼 trajectory를 바꿔야 하는 style에서는 오히려 잘못된 지표가 된다. 100STYLE에서는 급회전 때 속도 예측 오차가 누적되어 content error가 커진다(global space 사용은 future work).
- MI loss를 추가하면 style accuracy는 오르지만 content error도 오른다. style에 의존하는 trajectory 정보까지 첫 codebook에서 빠지는 trade-off이다.
- Ablation 표(Table 3)의 style accuracy가 어느 split(test/unseen, top-1/top-5) 기준인지 본문에서 명확히 확인하지 못했다(87.50%가 Table 1의 test top-1 83.20%와 다름). Appendix C를 확인해 볼 것.
- 관련 연구에서 기존 방법과 달리 임의 길이 motion을 real-time으로 style transfer할 수 있다고 하지만, 실제 속도 수치는 찾지 못했다.

## 나의 한마디
{: .mine-title}

