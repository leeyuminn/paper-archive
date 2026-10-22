---
title: "FACET: Force-Adaptive Control via Impedance Reference Tracking for Legged Robots"
short: "FACET"
authors: "Botian Xu, Haoyang Weng, Qingzhou Lu, Yang Gao, Huazhe Xu"
venue: "CoRL"
year: 2025
field: "Robot learning"
topic: "Legged locomotion"
approach: "Deep RL"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2505.06883"
  project: "https://facet.pages.dev/"
  code: ""
  video: ""
read_date: 2025-10-31
tags: [legged-robot, impedance-control, compliance, teacher-student, sim-to-real]
---

## 한 줄 요약

Legged robot이 velocity가 아니라 가상의 mass-spring-damper(impedance reference model)를 따라가도록 RL로 학습시켜, 외력에 대한 compliance와 힘 발휘 정도를 사용자가 gain으로 조절할 수 있게 만들었다.

## 요약

기존 RL 기반 locomotion/loco-manipulation은 velocity나 position tracking을 목표로 하기 때문에 외력이 들어와도 무조건 버티려 하고, 그 결과 동작이 뻣뻣하고 충돌 시 위험하다. FACET은 manipulator의 impedance control에서 아이디어를 가져와, 로봇 CoM에 정의한 가상의 mass-spring-damper가 외력을 받았을 때 그리는 궤적을 reference로 만들고 policy가 이를 따라가도록 학습한다. Policy의 입력 command는 setpoint `x_des`와 stiffness `K_p`, damping `K_d`, virtual mass `m`이므로, `K_p`를 낮추면 사람이 끈으로 끌고 다닐 수 있을 만큼 부드럽고 높이면 무거운 짐을 끌 만큼 단단해진다. 시뮬레이션에서 큰 impulse에 대한 생존율, 벽 충돌 시 impulse 감소를 보였고, 실제 Unitree Go2에서 compliant following과 최대 10kg 짐 끌기를 시연했다. 사족보행 로봇에 팔을 단 B1+Z1, 휴머노이드 G1으로의 확장도 보였다.

## 핵심 정리

- **Impedance reference model**: `m·ẍ_ref = K_p(x_des − x_ref) + K_d(ẋ_des − ẋ_ref) + f_ext`. 로봇과 reference model이 같은 외력 `f_ext`를 받는다고 보고, reference 쪽은 spring force를, 로봇 쪽은 ground reaction force를 받는다. GRF를 직접 맞추는 대신 reference dynamics를 적분한 position/velocity 궤적을 tracking target으로 쓴다(acceleration을 직접 tracking하면 학습이 안 됨).
- **Temporal smoothing**: 에피소드 시작부터 적분하는 open-loop target은 로봇의 물리 한계를 무시하고, 직전 상태부터 적분하는 closed-loop target은 noisy하고 근시안적이다. 그래서 `t−8Δt, t−16Δt, t−32Δt`(Δt = 0.02s)에서 시작해 적분한 여러 target의 reward를 평균한다.
- **Command 공간**: 평면 이동과 yaw `(x, y, θ_z)`의 setpoint, `K_p`, `K_d`(항상 critical damping `K_d = 2√K_p`), virtual mass(1/2/4kg 중 샘플). Setpoint는 고정 위치 / 고정 속도 / fully compliant 세 방식으로 샘플링한다.
- **Teacher-student sim-to-real**: RMA와 비슷한 2단계 구조. Teacher는 base 속도, 외력, 접촉 상태, joint torque, reference target 같은 privileged 정보를 보고, GRU estimator가 privileged feature를 예측하도록 같이 학습된다. RMA와 다른 점은 2단계에서 student actor를 teacher 파라미터로 초기화한 뒤 PPO로 계속 학습한다는 것(teacher를 그대로 모방하지 않고, 불완전한 추정을 전제로 최적화). Critic은 asymmetric.
- **학습 설정**: IsaacLab, PPO, 4096 env. 1단계 200M step, 2단계 50M step, RTX 4080 노트북에서 약 1시간.
- **시뮬레이션 실험(Go2)**: 1.5 m/s 전진 중 측면 ramp impulse를 가했을 때 velocity tracking(vanilla), random impulse로 학습한 robust baseline보다 큰 impulse에서 생존한다(abstract 기준 최대 200 Ns). 400N 피크에서 FACET은 힘 방향으로 밀려가며 균형을 회복한다. 가상 벽에 충돌 시 impulse가 robust보다 훨씬 작고 `K_p`로 조절 가능하다(abstract 기준 collision impulse 80% 감소).
- **Ablation(정규화된 tracking error)**: Smoothed teacher를 1.00으로 볼 때 pos error가 closed-loop teacher 17.71, acceleration teacher 70.51. Open-loop teacher는 0.72로 오히려 좋지만 student로 증류하면 10.31로, smoothed student(5.18)보다 나쁘다. 1단계 explicit estimation baseline인 Concurrent는 26.23.
- **실제 로봇(Go2)**: `K_p = 0, K_d = 4`로 끈을 당기거나 손가락으로 밀어 방향을 바꿀 수 있다. 짐 끌기에서 built-in controller는 2.5kg, robust는 5kg을 넘으면 실패하고 FACET은 10kg까지 끈다(체중의 약 2/3).
- **Loco-manipulator 확장**: base와 end-effector 각각에 reference model을 두고, end-effector 힘이 base로 전달되는 비율 `a`로 결합한다. `K_p^base`를 바꾸면 실제 당기는 힘이 spring force를 대략 따라간다.

## 흥미로운 점

- "무엇을 tracking할 것인가"를 바꾸는 것만으로 compliance를 controllable한 인터페이스로 만든 점. 보상 설계로 행동을 강제하지 않고, 물리적으로 해석 가능한 reference model을 하나 두고 그것을 imitation하게 한다.
- Open-loop target이 teacher 성능은 가장 좋지만 student 증류에는 나쁘다는 결과. teacher가 너무 완벽하면 student가 따라 하기 어렵다는 관찰이 다른 teacher-student 설정에도 참고가 될 것 같다.
- Physics-based character control에서도 velocity/pose tracking 대신 spring-damper reference를 쓰면 외력에 자연스럽게 반응하는 캐릭터를 만들 수 있을 것 같다(논문도 Deep Compliant Control 같은 character animation 연구를 related work로 언급).

## 한계와 의문

- 저자들이 밝힌 한계: reference model과 실제 로봇 dynamics의 차이가 multi-body 상황에서 특히 해결되지 않았고(end-effector target이 도달 불가능할 수 있음), 실제 로봇에 힘·가속도 센서가 없어 sim-to-real gap이 있다. Gait를 정해진 주파수의 oscillator로 제어해서 발 디딤 적응이 제한될 수 있다.
- 휴머노이드 G1에 대해서는 본문에 정량 결과가 거의 없다. 휴머노이드에서도 실제 로봇 실험을 했는지?
- 실제 로봇에서는 world frame이 없어 setpoint를 고정 속도/fully compliant 모드로만 줄 수 있다고 한다. 그러면 위치 setpoint 기반 기능(정해진 지점에서 버티기 등)은 실제로 어떻게 쓸 수 있을까?

## 나의 한마디
{: .mine-title}

