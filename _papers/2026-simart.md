---
title: "SIMART: Decomposing Monolithic Meshes into Sim-ready Articulated Assets via MLLM"
short: "SIMART"
authors: "Chuanrui Zhang, Minghan Qin, Yuang Wang, Baifeng Xie, Hang Li, Ziwei Wang"
venue: "SIGGRAPH"
year: 2026
field: "3D assets & physics"
topic: "Sim-ready assets"
approach: "MLLM 기반"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2603.23386"
  project: "https://simart-mllm.github.io"
  code: ""
  video: ""
read_date: 2026-07-08
tags: [articulated-objects, urdf, mllm, vq-vae, part-segmentation]
---

## 한 줄 요약

통짜(monolithic) 정적 메시를 MLLM이 한 번에 part 분해와 joint 파라미터(URDF)까지 예측해 시뮬레이터에 바로 넣을 수 있는 articulated asset으로 바꾸며, Sparse 3D VQ-VAE로 3D token 수를 약 70% 줄였다.

## 요약

3D 생성 모델은 고품질 정적 메시를 만들지만 part 분해나 kinematic 정보가 없고, 기존 articulated object 생성은 part 분해 → joint 추정 → 조립의 다단계 파이프라인이라 오류가 누적된다. 3D-native MLLM으로 한 번에 처리하려 해도 dense voxel tokenization은 빈 공간에 token을 낭비해 메모리가 부족해진다. SIMART는 Qwen3-VL을 backbone으로, 렌더링 이미지·sparse voxel geometry token·텍스트 지시를 함께 입력받아 part별 voxel token과 URDF 형식의 kinematic/physical 메타데이터(joint type, axis, limit, scale, 재질, density 등)를 생성한다. 빈 voxel에는 전용 zero token을 할당하고 점유된 voxel만 `<voxel> [xyz] [K]` 형태로 직렬화하는 Sparse 3D VQ-VAE가 핵심이며, 생성된 part voxel은 원래 메시 위에 graph 기반 분할로 다시 매핑된다. PartNet-Mobility/PhysXNet 계열 in-domain과 AI 생성 OOD 객체 모두에서 기존 방법보다 좋은 성능을 보인다.

## 핵심 정리

- 입력/출력: I = {이미지, raw geometry, 텍스트}, 출력 A = (part 분할 메시 M_seg, 시뮬레이션 메타데이터 P_sim)
- Sparse 3D VQ-VAE: 64³ voxel을 3D-UNet으로 latent grid로 인코딩(16³ 후 이웃 8개를 channel로 묶어 8³, 채널 64). 빈 위치는 zero token(codebook 0번), 점유 위치만 4,096-entry codebook에서 quantize. TRELLIS VAE로 초기화, 500k 객체로 사전학습
- 위치 정보: sparse token은 순서로 좌표를 알 수 없으므로 좌표 token [xyz]를 명시적으로 붙임
- Part 매핑: 디코딩된 part별 sparse point를 seed로, 정점별 Gaussian 확률 → mesh 인접 그래프 smoothing → majority voting으로 원본 메시 face에 label 부여. 원본 texture 유지
- 학습 데이터: PhysXNet + PartNet-Mobility 39,600개(articulated 5,600 + static 34,000). articulated 모델은 20개 kinematic state로 렌더링해 증강. URDF 생성용, part grounding용 QA 각 960k
- 학습: VQ-VAE 2단계 각 60,000 step(A100 8장), Qwen3-VL-8B fine-tune 30,000 step(A100 32장)
- SIMART-Bench: PartNet-Mobility in-domain + Hunyuan3D로 생성한 OOD 객체. P3SAM 과분할 결과를 사람이 2~4개 기능 part로 병합하고 axis/joint를 수동 annotation(10개 이상 카테고리, 36개 asset)
- 결과(Table 1): ID에서 Type 0.928, Axis 0.080, Origin 0.111, IoU 0.690, CD 0.087. AI 생성 객체에서 Type 0.831, IoU 0.777, CD 0.079로 Urdformer, Articulate-Anything, PhysX-Anything, Particulate보다 모두 좋음
- Part grounding(AI 생성): IoU 0.807, CD 0.018 vs P3SAM+Qwen3-VL-235B 0.507/0.234, PhysX-Anything 0.067/0.347
- Ablation: dense token은 평균 4,138 token으로 OOM, force sparse(zero token 없이) 862 token, zero sparse 516 token. vision 입력 추가 시 Type 0.794→0.937, IoU 0.745→0.832
- 응용: Isaac Sim에 바로 import해 로봇 조작 시뮬레이션, SAM3D와 결합한 클릭 기반 VR/AR asset 생성

## 흥미로운 점

- dense VQ-VAE 학습 중에도 2~4개의 codebook entry가 자연스럽게 "빈 공간" 표현으로 수렴한다는 관찰을 zero token으로 명시화한 점
- 생성 모델이 직접 메시를 만드는 대신 part voxel을 "seed"로만 쓰고 원본 고해상도 메시를 분할해 형상 충실도를 지킨다는 설계
- 렌더링 이미지 입력이 모양은 비슷하지만 관절 구조가 다른 객체를 구분하는 데 크게 기여한다는 ablation 결과
- 재질, density, Young's modulus까지 JSON으로 함께 내는 출력 형식 — sim-ready의 범위를 kinematics 이상으로 잡았다

## 한계와 의문

- 원문 스스로 articulated 데이터셋의 부족과 품질 불균일을 주요 한계로 꼽음
- 구현 세부가 원문 안에서 서로 다르다: 본문은 8×8×8 latent grid와 4,096 codebook, xyz = 64x+8y+z (x,y,z ∈ [0,7])라고 하지만, Appendix의 system prompt는 16×8×8 grid, K ∈ [0, 8191], xyz 범위 0–1023으로 적혀 있다. 실제 최종 설정은 어느 쪽인가?
- Table 1 캡션은 in-domain을 PhysXNet이라 하고 본문은 PartNet-Mobility라고 한다. 평가셋 구성이 정확히 무엇인지?
- SIMART-Bench가 36개 asset으로 작아 OOD 결과의 통계적 신뢰도가 궁금하다
- 64³ 해상도 voxel로 서랍 레일이나 작은 손잡이처럼 얇은 부품의 joint axis를 얼마나 정밀하게 잡을 수 있는지
- 결론에서는 "kinematic reasoning과 geometric generation을 decoupling"했다고 표현해 서론의 단일 통합 모델 주장과 표현이 엇갈린다

## 나의 한마디
{: .mine-title}

