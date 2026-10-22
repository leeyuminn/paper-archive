---
title: "How to Move Your Dragon: Text-to-Motion Synthesis for Large-Vocabulary Objects"
short: "Dragon T2M"
authors: "Wonkwang Lee, Jongwon Jeong, Taehong Moon, Hyeon-Jong Kim, Jaehyeon Kim, Gunhee Kim, Byeong-Uk Lee"
venue: "ICML"
year: 2025
field: "Character animation"
topic: "Text-to-motion"
approach: "Diffusion 기반"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2503.04257"
  project: "https://t2m4lvo.github.io/"
  code: ""
  video: ""
read_date: 2026-10-22
tags: [text-to-motion, motion-diffusion, arbitrary-skeleton, animal-motion, rig-augmentation]
---

## 한 줄 요약

Truebones Zoo(70종 이상 동물) 데이터에 사람이 직접 단 multi-level text annotation과 rig augmentation을 더하고, motion diffusion model에 TreePE·RestPE를 넣어 skeleton 구조가 제각각인 동물·공룡·상상 속 생물까지 하나의 모델로 text-to-motion을 하는 연구.

## 요약

기존 text-to-motion은 대부분 사람용 고정 skeleton 하나를 가정해서, 관절 수와 계층 구조가 다른 다양한 생물에는 적용하기 어렵다. 또 다양한 생물의 고품질 motion + text 데이터도 없다. 저자들은 (1) Truebones Zoo motion에 short/mid/long 세 단계 설명을 사람이 직접 달고, (2) bone 길이·관절 수·rest pose를 바꾸는 rig augmentation으로 같은 dynamics를 여러 skeleton 형태로 늘리며, (3) MDM 계열 diffusion transformer를 joint 차원을 유지하도록 바꾸고 skeleton 계층(TreePE)과 rest pose(RestPE)를 token에 더해 임의 skeleton에 적응하게 만든다. 학습은 pose diffusion(공간 attention) → motion diffusion(temporal attention 추가)의 2단계로 한다. ablation과 user study에서 제안 요소들이 모두 성능에 기여하고, 웹에서 받은 처음 보는 skeleton(페가수스, 날개 달린 괴물, 긴 목의 Alamosaurus 등)에도 일반화된다고 보인다.

## 핵심 정리

- 표현: global root translation 없이 joint별 rotation 시퀀스만 생성(F=90, J=150으로 padding). static feature(트리 구조 S, rest pose)는 condition으로 들어간다.
- 모델 변경점: 기존 MDM은 프레임마다 J×D를 한 token으로 압축하지만, 여기서는 (frame, joint)마다 token을 만들고 PE(f) + TreePE(j) + RestPE(j)를 더함. TreePE는 root에서 joint까지의 경로를 encoding, RestPE는 rest pose offset을 sinusoidal encoding + MLP로 embedding.
- 2단계 학습: 1단계 pose diffusion은 multi-view 렌더링 이미지(SigLIP image embedding)를 condition으로 프레임 단위 spatial attention을 학습하고 freeze. 2단계에서 temporal attention block을 끼워 넣어 SigLIP text embedding으로 motion 생성(factorized spatial-temporal attention).
- Rig augmentation: bone 길이 0.8~1.2배(GPT-4o로 관절을 부위별로 묶고 비율 결정, 좌우 대칭 유지), 말단/중복 관절 삭제·세분화, 임의 프레임 pose를 새 rest pose로 지정. 데이터가 125K pose / 1K motion → 2.5M pose / 26K motion으로 증가.
- 평가: SigLIP image 공간에 정렬한 pose-level encoder로 FID, R-Precision, Alignment, Coverage, Multimodality, MSI를 계산. 비교 대상은 GPT-4o caption 버전, rig augmentation 없는 버전, 객체별로 따로 학습한 SO-MDMs, retargeting.
- Table 1(pose model, augmentation 적용 test set): PE + rig aug.가 FID 0.2636, R@1 0.6707로 가장 좋음. PE가 없으면 R@1이 0.37 수준으로 크게 떨어짐.
- User study(30명) 선호도: Ours 65.60%, w/o Rig Aug. 12.40%, SO-MDMs 10.67%, Retargeting 9.07%, GPT caption 2.27%. MSI는 retargeting(9.93)이 Ours(8.78)보다 약간 높음.
- 학습: pose model 약 30시간, motion model 1M iteration 약 4일(A6000 또는 A100).

## 흥미로운 점

- 사람이 단 caption이 GPT-4o caption보다 확실히 낫다는 결과(선호도 65.6% vs 2.27%). 데이터 annotation 품질이 모델 설계만큼 중요하다는 근거.
- 개미의 "뒤집혀 누워 움직이지 않는" 설명을 dragon에 적용하는 식으로, 다른 생물의 motion 설명을 빌려 학습 데이터에 없는 동작을 만든다. 생물 간에 공유되는 구조를 amortized learning으로 배운다는 주장.
- skeleton 정보를 positional encoding으로 넣는 방식은 곤충·새처럼 비표준 skeleton을 다루는 작업에도 바로 응용해 볼 만하다.
- 같은 skeleton이라도 설명이 자세할수록 생성 다양성(multimodality)이 줄어드는 것을 수치로 보여 준다(Fig. 8).

## 한계와 의문

- root translation을 생성하지 않아 이동(locomotion) 궤적은 다루지 않는다. 저자도 한계로 인정.
- augment된 skeleton이 물리적으로 그럴듯하지 않을 수 있다(대칭, 균형, 해부학적 일관성). 1만 개 결과를 눈으로 확인했다고 하지만 정량 검증은 없다.
- 사람이나 open-vocabulary 객체로는 zero-shot 일반화가 잘 안 된다(Truebones Zoo에 인간형 skeleton이 없음).
- 평가 지표가 모두 pose-level encoder 기반이다. motion의 시간적 품질을 이 encoder가 충분히 반영할까?
- 사람 annotation 데이터와 코드를 공개하겠다고 했는데, 원문에는 코드 링크가 없다.

## 나의 한마디
{: .mine-title}
