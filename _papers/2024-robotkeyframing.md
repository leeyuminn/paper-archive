---
title: "RobotKeyframing: Learning Locomotion with High-Level Objectives via Mixture of Dense and Sparse Rewards"
short: "RobotKeyf"
authors: "Fatemeh Zargarbashi, Jin Cheng, Dongho Kang, Robert Sumner, Stelian Coros"
venue: "CoRL"
year: 2024
field: "Robot learning"
topic: "Legged locomotion"
approach: "Multi-critic RL"
links:
  paper: ""
  arxiv: ""
  project: "https://sites.google.com/view/robot-keyframing"
  code: ""
  video: ""
read_date: 2026-02-13
tags: [keyframing, quadruped, multi-critic, transformer, sparse-reward]
---

## 한 줄 요약

애니메이션의 keyframing처럼 "특정 시각에 특정 위치·자세"를 지정하면 사족 로봇이 그 사이를 자연스럽게 채우며 목표를 맞추도록, multi-critic RL과 transformer 기반 keyframe encoder로 학습한 locomotion 프레임워크.

## 요약

기존 legged robot 제어는 joystick 속도 명령이나 "최대한 빨리 목표 위치로" 같은 명령이 대부분이라, 언제 도달할지 같은 시간적 제어가 어렵다. 이 논문은 base position, orientation, joint posture의 전체 또는 일부를 목표로 하고 도달 시각을 지정한 keyframe을 여러 개 받아, 지정 시각에 맞추면서 중간 구간은 AMP 기반 style reward로 자연스럽게 움직이는 policy를 학습한다. Keyframe reward는 지정 시각에만 주어지는 sparse reward이고 style·regularization reward는 매 step 주어지는 dense reward라서, 둘을 섞으면 weight 튜닝이 어렵다. 이를 reward group마다 critic을 따로 두는 multi-critic PPO로 해결하고, 개수가 바뀌는 keyframe은 sequence-to-token transformer encoder로 처리한다. Isaac Gym에서 학습해 Unitree Go2 실기에서 위치 목표와 전신 자세 목표를 모두 시연했다.

## 핵심 정리

- **문제 설정**: keyframe k_i = (목표 ĝ, 시각 t̂). 목표는 위치, roll/pitch/yaw, joint angle 중 일부만 지정해도 된다. Keyframe 수는 최대 N_k까지 가변.
- **Multi-critic PPO**: regularization / style / goal 세 reward group마다 별도 critic을 학습하고, 각 group의 advantage를 따로 정규화한 뒤 가중합(실험에서는 style 0.5, goal 0.5, reg 0.1). 정규화 덕분에 reward sparsity 비율이 바뀌어도 같은 weight로 균형이 유지된다는 논리.
- **Sequence-to-token transformer**: 각 keyframe을 로봇 기준 goal error와 남은 시간(t̂ − t)으로 바꾸고 현재 state와 이어 붙여 하나의 token으로 만든다. 오차 0·시간 0인 self-goal token을 항상 첫 token으로 넣어 목표가 없을 때도 동작하게 하고, 출력은 max-pooling으로 하나의 feature로 줄인다. 빈 슬롯과 지난 keyframe(지정 시각에서 1초가 지난 것)은 masking.
- **데이터**: 개 mocap 데이터(Zhang et al. 2018) 약 20분을 IK로 retarget하고 artist 제작 clip을 추가. RSI(80%)와 dataset 기반에서 random keyframe으로 넘어가는 curriculum 사용.
- **실험 결과**:
  - Single-critic은 keyframe horizon이 길어질수록([25,50] → [75,100]) 같은 weight에서 수렴이 크게 늦어지지만 multi-critic은 재튜닝 없이 비슷하게 빠르게 수렴(Fig. 6).
  - 모든 목표를 아는 policy와 다음 목표만 아는 policy 비교(Table 1, 20회 평균): 두 번째 목표의 위치 오차가 Turn 시나리오에서 0.334m vs 0.727m, Straight에서 0.047m vs 0.133m.
  - Go2 실기에서 최대 5개 위치 목표 코스와 full-pose keyframe을 시연.

## 흥미로운 점

- Dense/sparse reward를 critic 단위로 나누고 advantage를 따로 정규화하면 reward 빈도와 크기가 학습에서 분리된다는 설명이 직관적이다. Reward 튜닝이 힘든 다른 문제에도 쓸 수 있어 보인다.
- Self-goal token과 time-to-goal을 token에 넣는 설계 덕분에 가변 개수의 미래 목표를 한 번에 보고 미리 몸을 돌리는 "future goal anticipation"이 생긴다.
- 저자들이 physics-based motion in-betweening으로 확장할 수 있다고 언급한 점이 캐릭터 애니메이션 쪽 연구와도 이어진다.

## 한계와 의문

- 저자 언급: 시각이 물리적으로 불가능한 keyframe이면 목표를 놓친다(넘어지지는 않음). AMP의 mode collapse를 그대로 물려받고, dataset에 없는 동작이나 목표로는 일반화가 어렵다.
- Keyframe 도달 정확도에 대한 정량 평가는 Appendix A.6에 있다고 하는데, 본문에는 Table 1 외의 수치가 거의 없다. 실기 정확도는 얼마나 될까?
- Multi-critic 비교가 learning curve 위주인데, 최종 keyframe 정확도나 motion 자연스러움에서도 차이가 날까?

## 나의 한마디
{: .mine-title}

