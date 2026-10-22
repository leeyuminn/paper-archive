---
title: "AdaptNet: Policy Adaptation for Physics-Based Character Control"
short: "AdaptNet"
authors: "Pei Xu, Kaixiang Xie, Sheldon Andrews, Paul G. Kry, Michael Neff, Morgan McGuire, Ioannis Karamouzas, Victor Zordan"
venue: "ACM TOG"
year: 2023
field: "Physics-based control"
topic: "Policy adaptation"
approach: "Latent space adaptation"
links:
  paper: "https://doi.org/10.1145/3618375"
  arxiv: "https://arxiv.org/abs/2310.00239"
  project: ""
  code: "https://motion-lab.github.io/AdaptNet"
  video: ""
read_date: 2026-10-22
tags: [policy-adaptation, latent-space, style-transfer, morphology, reinforcement-learning]
---

## 한 줄 요약

이미 학습된 physics-based locomotion policy를 처음부터 다시 학습하지 않고, latent space에 zero-initialized 모듈을 끼워 넣어 새로운 스타일·체형·지형에 빠르게 적응시키는 방법.

## 요약

RL 기반 캐릭터 controller는 새 행동이 필요할 때마다 보통 처음부터 다시 학습해야 하고, 단순 fine-tuning은 불안정하거나 기존 능력을 잊기 쉽다. AdaptNet은 ControlNet·LoRA에서 영감을 받아, 사전 학습된 policy의 가중치는 고정한 채 두 가지 모듈을 추가한다. 하나는 state encoder 직후의 latent z에 offset을 더하는 latent space injection이고, 다른 하나는 이후 각 fully-connected layer 옆에 branch를 두어 출력을 미세 조정하는 internal adaptation이다. 두 모듈 모두 마지막 층을 0으로 초기화해서 학습 시작 시점에는 원래 policy와 똑같이 동작한다. 1~2 gait cycle짜리 짧은 style clip으로 하는 few-shot style transfer, 팔다리 길이 변경과 joint lock, 저마찰·울퉁불퉁한 지형 적응 등에 적용했고, 원래 policy 학습(약 26시간)보다 훨씬 짧은 10~30분(단순 과제)에서 최대 4시간(험한 지형) 안에 적응했다.

## 핵심 정리

- **Latent space injection**: z_t = E_ξ(s_t) + I_φ(s_t, c_t). I_φ의 encoder는 원래 encoder 가중치를 복사해 시작하고, 마지막 FC는 zero init. c_t는 heightmap 같은 새 control input(선택)으로, CNN G_φ로 처리한다.
- **Internal adaptation**: 각 layer에서 z^i = F_θ(z^{i-1}) + F_η(z^{i-1}). F_η도 zero init이고 L2 regularization으로 크게 벗어나지 않게 한다. 저자들은 이를 full-rank 버전의 LoRA로 본다.
- 학습 목적함수에 injection 크기에 대한 regularization(β, 실험에서는 0.01)을 추가해 latent가 원래 policy가 다룰 수 있는 영역에 머물도록 한다.
- 실행 시 scaling 계수 α로 adaptation 정도를 조절할 수 있어, 원래 걷기와 새 스타일 사이 또는 두 AdaptNet 모델 사이를 보간할 수 있다.
- Pre-training과 adaptation 모두 저자들의 이전 multi-objective framework(imitation critic과 goal critic을 분리하고 advantage를 따로 정규화, discriminator ensemble로 imitation reward)를 사용. Adaptation 시 discriminator와 critic은 새로 학습한다.
- **설정**: Isaac Gym, 15 body link·28 DoF 캐릭터, 시뮬레이션 120Hz·policy 30Hz, LAFAN1 기반 걷기·달리기 reference.
- **비교**: Scratch, FT(직접 fine-tuning), FT+Reg, PNet(progressive network). 8M sample 예산 안에서 Scratch는 실패하고, FT는 style transfer에서 새 style만 따라 하다 방향 전환을 잊는다(catastrophic forgetting). AdaptNet이 최종 성능과 sample efficiency 모두 가장 좋았다.
- **Ablation**: injection 위치는 encoder 직후인 Z^0가 가장 좋고 action 쪽으로 갈수록 동작이 jerky해진다. Table 2 imitation error에서 LSA+IA가 가장 낮았다(예: Goose Step 0.11m vs LSA만 0.18m). LoRA는 rank 64에서도 full-rank보다 못했다.

## 흥미로운 점

- 이미지 생성 모델의 ControlNet/LoRA 아이디어(zero init, frozen backbone)를 RL policy에 옮긴 시도라는 점. "학습 시작 시점에 원래 policy와 똑같다"는 성질이 exploration을 안정적으로 만든다.
- Latent space를 MDS로 시각화했을 때 걷기 policy를 중심으로 style들이 원형으로 분포하고, 중심에서의 거리가 imitation error와 대체로 맞는다는 관찰.
- Joint lock은 action 차원을 그냥 잘라내고, 체형 변경은 retarget 없이 원래 reference를 그대로 쓰는 등 적응 설정이 단순하다.

## 한계와 의문

- 저자 언급: 사전 학습 policy가 반드시 있어야 하고, 걷기에서 긴 체공이 있는 점프처럼 원래 행동과 크게 다른 적응은 잘 되지 않는다. Internal adaptation을 쓰면 보간 결과가 항상 자연스럽지는 않다.
- 비교 실험이 대부분 learning curve와 imitation error라서, 사람이 보기에 얼마나 자연스러운지에 대한 평가는 영상에 의존한다.
- Locomotion 외의 policy(예: 물체와 상호작용하는 skill)에도 Z^0 injection이 똑같이 잘 맞을까?

## 나의 한마디
{: .mine-title}

