---
title: "Autonomous Human-Robot Interaction via Operator Imitation"
short: "OpImit"
authors: "Sammy Christen, David Müller, Agon Serifi, Ruben Grandia, Georg Wiedebach, Michael A. Hopkins, Espen Knoop, Moritz Bächer"
venue: ""
year: 2025
field: "Robot learning"
topic: "Human-robot interaction"
approach: "Diffusion 기반"
links:
  paper: ""
  arxiv: ""
  project: ""
  code: ""
  video: "https://youtu.be/4U4etupwzhQ"
read_date: 2026-10-22
tags: [human-robot-interaction, teleoperation, imitation-learning, transformer, robotic-character]
---

## 한 줄 요약

원격 조종자(operator)의 gamepad 입력을 그대로 모방하는 diffusion 모델을 학습해, 40분 미만의 데이터로 로봇 캐릭터가 사람에게 반응하고 감정(mood)을 표현하는 자율 상호작용을 구현했다.

## 요약

Teleoperated 로봇 캐릭터는 숙련된 operator 덕분에 사람과 표현력 있게 상호작용하지만, operator 없이 자율적으로 같은 일을 하기는 어렵다. 이 논문은 로봇의 low-level action이 아니라 operator의 command(joystick 같은 continuous 신호 + 버튼 같은 discrete 이벤트)를 예측하도록 학습하고, 기존 RL 기반 motion control이 이 command를 실행하게 한다. 모델은 transformer 하나에 continuous command용 diffusion과 discrete 이벤트용 classifier를 함께 붙인 구조이며, 로봇 기준 상대 좌표로 바꾼 사람 pose와 과거 command를 조건으로 받는다. 20명 user study에서 사용자는 default 모드의 자율 모드와 실제 operator를 거의 구분하지 못했고(정답률 약 50%), 네 가지 mood를 68~74% 정확도로 맞혔다. 같은 조종 인터페이스를 쓰는 휴머노이드로의 zero-shot transfer도 보였다.

## 핵심 정리

- **문제 설정**: 과거 M프레임의 사람 pose와 로봇 pose(각각 3D 위치 + quaternion)로부터 미래 N프레임의 continuous operator command와, 예측 window마다 한 번씩 discrete behavior(춤, 점프 같은 미리 정의된 애니메이션 트리거)와 mode(walking/standing)를 예측한다.
- **데이터**: OptiTrack mocap 공간에서 expert operator 1명이 로봇을 조종하고 사람 2명이 번갈아 상호작용. Default, Sad, Shy, Angry, Happy 다섯 mood, 총 37분. 사람은 마커가 달린 모자만 쓴다.
- **모델**: CAMDM(character control용 diffusion)을 기반으로 한 transformer. Continuous command는 MDM처럼 clean sample `x̂_0`를 직접 예측하는 diffusion(8 step)으로, discrete 출력은 ViT식 classification query token(`q_b`, `q_m`)과 weighted cross-entropy로 학습한다. Mood마다 별도 모델을 학습한다.
- **HRI용 수정점**: (1) 사람이 가까우면 조건 값이 0에 가까울 수 있어서, zero-masking(classifier-free guidance용)을 raw 조건이 아니라 encoding 이후에 적용한다. (2) Positional encoding의 dropout은 출력이 noisy해져서 뺀다. (3) 사람 키 다양성을 위해 높이에 ±0.3m random offset을 준다. (4) 출력에 Gaussian smoothing.
- **구현**: latent 128, 2-layer, 2 head. 과거 15프레임, 미래 25프레임 예측 후 마지막 15프레임을 다음 window의 과거 command로 쓴다. 10개 continuous 신호. 전부 로봇 on-board computer에서 50 Hz로 돌고, 예측 command는 animation engine → RL low-level policy → 600 Hz PD controller로 전달된다.
- **로봇**: Grandia et al.(RSS 2024)의 이족 로봇 캐릭터. 키 0.66m, 15.4kg, 다리당 5 DoF, 목 4 DoF, 안테나·발광 눈·헤드램프·스피커.
- **시뮬레이션 평가(default 모드)**: 지표는 Facing Angle Error(FAE), 사람과의 거리 Tracking Error(TE), 신호 변화율 MSD. 같은 transformer에서 diffusion을 뺀 deterministic baseline은 FAE 57.66 / MSD 4.40, 제안 모델(25프레임)은 43.85 / 2.42. 사람 pose를 빼면 FAE 100.28로 크게 나빠지고, 과거 command를 빼면 tracking은 좋지만 MSD 14.80으로 window 사이가 끊긴다. Window는 25프레임이 50·75보다 좋았다.
- **User study(20명)**: operator 구분 실험에서 operator를 operator로 맞힌 비율 55%, 자율을 자율로 맞힌 비율 53%. Wilcoxon signed-rank test에서 유의한 차이 없음(p≈0.655). Mood 인식 정확도 68~74%. Angry가 Happy로(26%), Sad가 Shy로(21%) 혼동되었다. "로봇이 나에게 반응한다고 느꼈다" 항목 평균 4.9/5.

## 흥미로운 점

- 로봇의 관절 action 대신 "operator가 누르는 입력"을 imitation 대상으로 삼아 데이터 요구량을 크게 줄이고, 기존 controller의 스타일·안정성·안전 제약을 그대로 유지한 점. 조종 인터페이스가 같으면 다른 로봇으로 바로 옮겨진다는 것도 이 선택의 장점이다.
- Diffusion으로 continuous를, 같은 transformer의 query token으로 discrete를 동시에 예측하는 hybrid 구조. Gamepad 레이아웃(joystick + button)과 출력 구조가 그대로 대응된다.
- 조건 값 0이 의미 있는 값일 때 masking을 encoding 뒤로 옮기는 트릭은 다른 conditional motion diffusion에도 쓸 수 있을 것 같다.

## 한계와 의문

- 저자들이 밝힌 한계: 사람 pose를 mocap에 의존하고, 긴 시간에 걸친 의사결정이나 여러 상호작용을 잇는 행동은 다루지 않는다. Mood는 사람이 수동으로 고르고, operator 1명·사람 2명 데이터, 신체 접촉 없는 1:1 상호작용에 한정된다.
- Operator 구분 실험은 default 모드에서만 했다. Mood가 들어간 상호작용에서도 operator와 구분되지 않을까?
- 휴머노이드 zero-shot transfer는 정성적 결과(그림, 영상)만 있다. 다리 길이나 속도가 다른 로봇에서도 같은 joystick 입력이 같은 의미가 될까?
- 원문 PDF에 학회명과 연도 표기가 없다. year 2025는 PDF 생성일(2025-07)과 참고문헌에 2025년 논문이 있는 점을 근거로 넣은 값이다.

## 나의 한마디
{: .mine-title}

