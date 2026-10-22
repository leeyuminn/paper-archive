---
title: "Bootstrapping Reinforcement Learning with Imitation for Vision-Based Agile Flight"
short: "BootRL"
authors: "Jiaxu Xing, Angel Romero, Leonard Bauersfeld, Davide Scaramuzza"
venue: "CoRL"
year: 2024
field: "Robot learning"
topic: "Drone flight"
approach: "IL + RL fine-tuning"
links:
  paper: ""
  arxiv: ""
  project: "https://bootstrap-rl-with-il.github.io/"
  code: ""
  video: ""
read_date: 2026-03-11
tags: [quadrotor, drone-racing, visuomotor-policy, imitation-learning, fine-tuning]
---

## 한 줄 요약

State 기반 RL teacher → vision 기반 IL student → 성능에 따라 학습률을 조절하는 RL fine-tuning의 3단계로, IMU나 state estimation 없이 RGB 이미지(또는 gate corner)만 보고 드론 레이싱을 하는 visuomotor policy를 학습했다.

## 요약

고차원 시각 입력에서 RL을 처음부터 돌리면 탐색이 너무 비효율적이라 실패하고, IL은 sample-efficient하지만 expert 성능을 넘지 못하고 covariate shift 문제가 있다. 이 논문은 둘을 합친다: (I) privileged state로 PPO teacher를 학습하고, (II) DAgger로 시각 입력 student에 증류한 뒤, (III) student를 actor 초기값으로 삼아 vision 기반 RL로 fine-tuning한다. 3단계에서는 catastrophic forgetting을 막기 위해 critic을 먼저 warm-up하고, rollout reward가 초기 대비 얼마나 좋아졌는지에 따라 policy 학습률과 PPO clip range를 키운다. 같은 10M sample 예산에서 세 트랙 모두 BC, RL from scratch, DAgger, PIRLNav보다 success rate, gate 통과 오차, lap time이 좋았고, 실제 드론에서도 DAgger보다 빠른 lap time을 냈다.

## 핵심 정리

- **Action / 입력**: policy는 collective thrust와 body rate `[c, ωx, ωy, ωz]`를 출력한다. Student 입력은 (i) ImageNet pretrained ResNet50 embedding(길이 128) 또는 (ii) 카메라 이미지에 투영된 gate corner 픽셀 좌표의 history이고, TCN으로 인코딩한 뒤 MLP로 action을 낸다.
- **Phase I (teacher)**: 위치, 회전, 속도, 각속도, 다음 gate 상대 위치를 입력으로 PPO 학습. Reward는 gate 쪽 progress, 카메라가 다음 gate를 향하게 하는 perception-aware 항, action 변화·body rate 페널티(motion blur 감소), gate 통과 보너스, 충돌 페널티.
- **Phase II (IL)**: teacher action과 student action의 MSE로 증류. BC보다 on-policy로 데이터를 모으는 DAgger가 더 잘 된다.
- **Phase III (performance-adaptive fine-tuning)**: actor를 고정하고 critic만 N iteration 먼저 학습. 이후 주기적으로 rollout reward와 초기 reward의 비율 α를 계산해, α가 1보다 클수록 policy 학습률과 clip range는 올리고 value 학습률은 낮춘다. Critic에는 privileged state를 주는 asymmetric actor-critic을 쓴다.
- **실험 설정**: SplitS, Figure 8, Kidney 세 트랙. Policy마다 100회 평가, seed 5개, BEM 기반 공기역학 시뮬레이션. 지표는 success rate(SR), mean gate-passing error(MGE), lap time(LT). Corner 입력에는 픽셀 노이즈와 corner 누락 같은 domain randomization을 준다.
- **주요 결과(Table 1, history 길이 6개 평균)**: BC와 RL from scratch는 모든 트랙에서 SR 0%. Pixel 입력 SR이 DAgger 63/57/64%, PIRLNav 21/4/18%, 제안 방법 85/76/82%(Figure 8 / SplitS / Kidney 순).
- **Sample 배분**: 총 10M sample에서 IL pretraining 60% + RL fine-tuning 40%일 때 deployment reward가 가장 높았다. Vanilla fine-tuning(adaptive 없이 같은 RL 설정)은 초반에 오르다가 점점 무너진다.
- **강건성**: 프레임 blackout(perceptual)과 위치 점프(positional) 교란에서 DAgger보다 SR이 높다. 예: perceptual 5% 확률에서 IL 33% vs 제안 방법 91%.
- **속도 한계**: thrust 한도를 올린 SplitS에서 corner 입력 policy가 평균 lap time 5.82s, 최고 5.54s. 비교 대상인 state 기반 챔피언급 RL policy(Kaufmann et al., Nature 2023)는 median 5.52s, 최고 인간 파일럿은 5.76s.
- **실제 비행**: VICON mocap으로 perceptual input을 만드는 Hardware-in-the-Loop 방식. 이미지 입력 SplitS lap time이 DAgger 8.06s 대비 7.67s로, 세 트랙 모두 lap time과 gate 오차가 개선되었다. 더 빠듯한 궤적과 높은 peak 속도를 보였다.

## 흥미로운 점

- RL fine-tuning의 학습률과 clip range를 iteration 수가 아니라 현재 성능에 묶어서, 사람이 조정해야 하던 부분을 줄이고 forgetting을 억제한 점. Task-specific 정보가 들어가지 않아 다른 teacher-student 설정에도 바로 붙일 수 있어 보인다.
- 일반적인 teacher-student 증류(RMA 등)가 student에서 끝나는 반면, student를 다시 RL로 올려서 teacher가 보지 못한 부분 관측 상황에 맞게 행동을 고치게 한다.
- 느린 IL policy를 이 방법으로 fine-tuning하면 챔피언급 policy와 lap time 차이가 0.05s 안으로 줄어든다는 부록 실험(state 입력)이 흥미롭다.

## 한계와 의문

- 저자들이 밝힌 한계: 통제된 실내 환경에서만 테스트했고 실외 환경에서는 실패할 가능성이 크다. Perception module(pretrained ResNet)이 out-of-distribution에 약하다.
- "Real-world" 실험이 실제 카메라 영상이 아니라 VICON + HIL 시뮬레이션으로 perceptual input을 만든 것으로 보인다. 진짜 onboard RGB에서의 성능은 확인되지 않는다.
- Corner 누락 확률이 본문(10%)과 부록(20%)에서 다르게 적혀 있다. 어느 쪽이 실험에 쓰였을까?
- 부록 Table 6 캡션이 Table 5 캡션을 그대로 복사한 것처럼 보여 표 내용과 맞지 않는다.

## 나의 한마디
{: .mine-title}

