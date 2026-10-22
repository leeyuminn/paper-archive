---
title: "Learning to Ball: Composing Policies for Long-Horizon Basketball Moves"
short: "LearnBall"
authors: "Pei Xu, Zhen Wu, Ruocheng Wang, Vishnu Sarukkai, Kayvon Fatahalian, Ioannis Karamouzas, Victor Zordan, C. Karen Liu"
venue: "SIGGRAPH Asia"
year: 2025
field: "Physics-based control"
topic: "Skill composition"
approach: "Hierarchical RL"
links:
  paper: "https://doi.org/10.1145/3763367"
  arxiv: "https://arxiv.org/abs/2509.22442"
  project: ""
  code: ""
  video: ""
read_date: 2025-12-05
tags: [basketball, policy-composition, long-horizon, soft-routing, adversarial-imitation]
---

## 한 줄 요약

Dribble → gather → shoot처럼 중간 단계의 시작·끝 state가 명확하지 않은 multi-phase 농구 동작을, 앞 policy를 initial state generator로, 뒤 policy의 value function을 reward로 써서 중간 policy를 학습하고 soft router로 이어 붙인 프레임워크.

## 요약

긴 horizon의 과제는 목표가 분명한 subtask(dribble, shoot)와 목표가 애매한 전환 subtask(gather)로 나뉜다. Mixture of experts는 policy끼리 공유하는 state가 충분해야 하고, skill chaining은 각 skill의 terminal state가 잘 정의돼야 해서 이런 경우에 잘 맞지 않는다. 이 논문은 전환을 세 종류(A: 바로 실행, B: 서로 적응, C: 중간 policy 필요)로 나누고, 가장 어려운 C에서는 앞 policy(dribble)의 rollout state를 초기 상태로, 뒤 policy(shoot)의 state value V̄_shoot를 reward shaping으로 써서 중간 policy(gather)를 학습한다. 동시에 shoot policy도 gather가 만든 state에 맞게 AdaptNet 방식으로 함께 적응시킨다. 마지막으로 primitive policy들의 action을 가중합하되 한 policy가 주도하도록 유도하는 high-level soft router를 학습해, 사용자 명령에 따라 실시간으로 dribble과 jump shot을 이어 간다. 결과적으로 shoot-off-the-dribble에서 shot percentage 91.8%를 얻었다.

## 핵심 정리

- **Primitive policy 학습**: PPO + adversarial imitation(discriminator ensemble) + multi-objective framework. 공 trajectory 없이 task reward만으로 공과의 상호작용을 탐색한다.
  - 데이터가 이질적이다: 인터넷 영상(ExAvatar로 손, TRAM으로 몸 포즈 추출), 손 없는 전신 mocap(CMU, LAFAN1 달리기), 직접 녹화한 손 동작(Rokoko Smartgloves). 신체를 lower body / upper body / hands로 나눠 group별 discriminator로 학습해 서로 대응되지 않는 데이터를 함께 쓴다.
  - Shoot는 손 포함 전신 jump shot 시범 3개만으로 학습.
  - 반칙 감지(손 이외 부위 접촉, traveling)를 reward에 포함.
- **Intermediate policy(Type C)**: r_gather = r_pose + 0.25·Clip(V̄_shoot, −v, v), 위반 시 −1. V̄_shoot는 PopArt로 정규화.
  - Gather 학습 중 V̄_shoot > −v인 "좋은" state를 골라 shoot policy를 적응시키고, 업데이트된 value를 다시 gather reward에 쓴다. 초기 bootstrapping을 위해 공을 들고 골대 쪽을 보고 있으면 낮은 value state도 25% 확률로 허용.
- **Soft router**: ω_t = c_t + π_c(s_t, g_t, c_t), a_t = ω_t · [a_dribble, a_gather, a_shoot]. c_t는 휴리스틱 one-hot 기준 명령이고 router는 그 offset을 학습한다. 한 policy의 weight가 나머지 합보다 클 때만 reward를 줘서 one-hot에 가깝게 유도. 학습 후 하나의 네트워크로 distillation.
- **실험**(Isaac Gym, 2.5~7.5m 링 구역, cell당 400회):
  - Ball catching rate: Ours 98.3%, DirectExecution 0.7%.
  - Shot percentage: Ours 91.8%, DirectExecution 1.3%, NoAdapt 6.1%, SequentialChaining 12.7%. 참고로 reference 상태에서 시작한 pretrained shoot policy는 93.0%.
  - High-level policy 유무: catching 86.0% → 98.3%, shot 67.4% → 91.8%. Hard router는 휴리스틱 baseline보다도 낮았다.
- Type B(서로 적응)로 catch/pass, rebound → dribble 등을 구성하고, 2-on-2 실시간 대전까지 시연.

## 흥미로운 점

- "앞 policy는 initial state generator, 뒤 policy는 value function evaluator"라는 역할 분리가 깔끔하다. Reward를 정의하기 어려운 전환 동작을 다음 skill의 value로 정의한다는 발상.
- 같은 저자 그룹의 AdaptNet(latent space adaptation)을 전환 학습의 부품으로 재사용한다.
- Hard router가 휴리스틱보다 못했다는 결과: 사전 학습된 primitive가 있어도 조합 학습은 쉽지 않고, 휴리스틱 명령 주변에서 탐색을 시작하는 soft routing이 효과적이었다.
- 손과 몸 데이터가 대응되지 않아도 신체 group별 imitation으로 합칠 수 있다는 점은 데이터가 부족한 상호작용 동작에 응용할 만하다.

## 한계와 의문

- 저자 언급: 참고 데이터가 부족해 동작 품질이 숙련 선수 수준에 못 미친다. Dribble 자세가 달리기 팔 위치처럼 높고, rebound 점프가 낮다(점프 clip이 1개뿐).
- Type A/B/C 중 어느 것을 쓸지는 사람이 subtask 쌍마다 정하는 것으로 보인다. 이 판단을 자동화할 수 있을까?
- Subtask가 더 많아지면 각 쌍마다 중간 policy와 적응을 반복해야 하는데, 확장 비용은 어느 정도일까?

## 나의 한마디
{: .mine-title}

