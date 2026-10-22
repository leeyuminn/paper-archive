---
title: "PhysAnimator: Physics-Guided Generative Cartoon Animation"
short: "PhysAnim"
authors: "Tianyi Xie, Yiwei Zhao, Ying Jiang, Chenfanfu Jiang"
venue: ""
year: 2025
field: "Image & video generation"
topic: "Video motion control"
approach: "Physics-guided diffusion"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2501.16550"
  project: "https://xpandora.github.io/PhysAnimator/"
  code: ""
  video: ""
read_date: 2026-10-22
tags: [anime, deformable-simulation, image-to-video, sketch-guided, controlnet]
---

## 한 줄 요약

정지된 anime 일러스트의 객체를 2D deformable mesh로 만들어 물리 시뮬레이션으로 움직임(optical flow)을 구하고, 그 흐름으로 warp한 sketch를 조건으로 video diffusion이 프레임을 렌더링하게 해서 물리적으로 그럴듯하고 사용자가 제어 가능한 cartoon animation을 만든다.

## 요약

Drag나 trajectory 기반 video diffusion은 예측한 optical flow에 기하·물리적 이해가 없어 왜곡이 생기고, 전통적인 2D animation 도구는 lineart나 레이어 분리 같은 단순한 입력을 가정한다. PhysAnimator는 SAM으로 대상 객체를 분할해 Delaunay 삼각화로 2D mesh를 만들고, Fixed Corotated 모델의 image-space deformable body simulation으로 optical flow 시퀀스를 계산한다. 사용자는 바람 같은 외력을 energy stroke로, 고정·궤적을 rigging point로 지정할 수 있다. 렌더링은 원본 이미지를 직접 warp하는 대신 sketch를 추출·warp한 뒤, 이를 조건으로 하는 sketch-guided ControlNet + Stable Video Diffusion이 수행하고, 선택적으로 cartoon interpolation 모델(ToonCrafter)로 물리 법칙 밖의 과장된 dynamics를 보탠다. 20장의 anime 이미지 평가에서 VideoScore의 visual quality, temporal consistency, factual consistency가 가장 높았고 user study에서도 모든 baseline보다 선호되었다.

## 핵심 정리

- **Geometry registration**: 사용자 query point로 SAM segmentation → 마스크 경계를 균일 sampling → conforming Delaunay triangulation으로 simulation용 2D 삼각형 mesh 생성. Anime 캐릭터는 3D 복원이 어렵기 때문에 2D로 처리.
- **Deformable body dynamics**: Fixed Corotated energy density(Lamé 파라미터 μ, λ는 사용자가 조절)로 내부 힘을 구하고 Newton 운동방정식을 semi-implicit Euler로 적분. Taichi로 구현. 삼각형 내부 픽셀의 변위를 모아 F_{0→t} optical flow를 만든다.
- **사용자 제어**: flow particle을 실은 energy stroke로 외력을 전달하고, rigging point로 영역을 고정하거나 지정 궤적을 따르게 함.
- **Sketch-guided rendering**: 원본 이미지를 바로 warp하면 occlusion으로 구멍이 생기므로, sketch를 forward warping(움직임이 큰 픽셀에 가중치)해 texture-agnostic 시퀀스를 만든 뒤 ControlNet으로 SVD를 조건화. 분할 오차로 생긴 불완전한 sketch에 대응하려고 학습·추론 모두 sketch에 Gaussian blur를 적용.
- **Complementary dynamics**: 렌더링 결과에서 n=15 간격으로 keyframe을 뽑아 ToonCrafter(control scale 0.1의 sketch ControlNet 추가)로 중간 프레임을 재생성해 옷 윤곽 변형이나 새 선 같은 비물리적 표현을 추가.
- **데이터**: Sakuga-42M(1.4M clip)에서 24 frame 미만, dynamics score 0.05–0.7 범위 밖의 clip을 제외하고 sketch를 추출해 380,000쌍 구축.
- **평가**: 비교 대상은 text 기반 I2V(Cinemo, DynamiCrafter, prompt는 ChatGPT-4V로 생성)와 trajectory 기반(Motion-I2V, DragAnything, 궤적은 본 방법의 결과에서 추출). 20장 × 10개 = 방법당 200개 영상. Ours FID 90.4, VideoScore VQ 2.89 / TC 2.86 / DD 2.48 / FC 2.64. FID는 거의 정적인 영상을 만드는 Cinemo(49.5)가 가장 낮고, dynamic degree는 DragAnything(2.97)이 가장 높음(저자들은 camera 이동으로 오해한 탓이라고 설명). 2AFC user study에서 baseline 대비 선호율 76–97%.

## 흥미로운 점

- 물리 시뮬레이션은 "어떻게 움직일지"만 담당하고 외형 렌더링은 diffusion에 맡기는 분업. 중간 표현으로 이미지 대신 sketch를 써서 분할 오차와 occlusion 문제를 완화한다.
- 물리적으로 정확한 결과가 오히려 anime답지 않을 수 있다는 점을 인정하고, 데이터 기반 interpolation으로 "과장"을 다시 보태는 설계.
- Energy stroke, rigging point, Lamé 파라미터처럼 animator가 직관적으로 이해할 수 있는 control handle을 제공한다.

## 한계와 의문

- 원문 본문에 별도의 limitation 절은 없다. 저자들은 2D 시뮬레이션이라 3D 효과를 완전히 표현하지 못한다는 점만 언급한다.
- SAM 분할 품질에 크게 의존하는 것으로 보인다. 겹친 레이어(앞머리와 얼굴 등)나 자기 가림은 어떻게 처리될까?
- 평가셋이 직접 만든 20장 규모라 작고, VideoScore의 dynamic degree에서는 일부 baseline보다 낮다. 움직임의 크기를 어떻게 조절하는지 더 보고 싶다.
- 캐릭터 몸 전체 동작(걷기 등)보다는 머리카락, 옷, 식물처럼 2차 동역학 위주의 예시들이다. 관절 움직임에도 적용할 수 있을까?

## 나의 한마디
{: .mine-title}

