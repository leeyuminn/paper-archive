---
title: "Fishbone: From One 3D Asset to a Million Controllable Edits"
short: "Fishbone"
authors: "Yumeng He, Xiaoying Wang, Peihao Li, Yanjia Huang, Joe Masterjohn, Jiajun Wu, Leonidas Guibas, Yin Yang, Ying Jiang, Chenfanfu Jiang"
venue: "preprint"
year: 2026
field: "3D assets & physics"
topic: "Shape deformation"
approach: "Rib-spine 표현"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2605.24805"
  project: ""
  code: ""
  video: ""
read_date: 2026-08-26
tags: [mesh-deformation, skinning, reduced-simulation, data-augmentation, 3d-generation]
---

## 한 줄 요약

메시에서 척추(spine)와 갈비뼈(rib) 같은 제어 구조를 자동으로 뽑아, 수동 rigging이나 category별 학습 없이 저차원 파라미터로 편집·reduced simulation·keyframe animation을 할 수 있게 한 표현.

## 요약

대규모의 다양한 3D asset이 필요하지만, 기존 deformation 방법은 sparse 입력 기반이라 국소 편집이 부정확하거나(학습 기반), cage·skeleton·lattice 같은 제어 구조를 사람이 직접 만들어야 한다(parametric 방법). Fishbone은 생물의 척추와 갈비뼈에서 착안해, 메시 위의 geodesic field 등고선을 rib(단면)으로, rib 중심을 이은 곡선을 spine으로 삼는 F=(R, S, W) 표현을 자동으로 구성한다. rib으로는 두께·단면 모양 같은 국소 형상을, spine으로는 bending·twisting·stretching 같은 전역 변형을 제어하며, 같은 spine을 reduced coordinate로 써서 실시간 물리 기반 secondary motion과 keyframe animation도 지원한다. Hunyuan3D part-level 데이터에 이 표현을 붙인 Fishbone-136K 데이터셋을 만들고, 이미지 조건 3D 생성, 로봇 grasping 데이터 증강, VLM agent 기반 편집에 적용했다.

## 핵심 정리

- Rib 추출: part별 bounding box의 최장 축으로 root를 자동 선택하고, heat method로 geodesic field를 계산한 뒤 여러 level의 iso-contour를 rib으로 추출. solid는 closed loop, thin-shell은 open polyline 유지. rib 개수 K는 part 크기 비율에 맞춰 적응적으로 결정
- 분기 처리: 한 level에서 여러 sub-rib이 생기면 face-adjacency 그래프 BFS로 parent-child 트리를 만들어 팔·다리 같은 가지를 구분. spine은 junction 점을 공유하는 tree 구조
- Spine 점: rib을 PCA 평면에 투영한 뒤 평탄도(F), 중심 근접(C), 부모와의 연속성(P)을 합친 score를 최대화하는 위치를 선택
- Skinning: 정점-rib edge 거리, 정점-spine 점 거리에 adaptive Gaussian weight(soft cutoff)를 적용한 sparse 행렬 W_r, W_s
- 변형 primitive: rib 기반 6종(uniform/anisotropic scaling, translation, rotation, local drag, cross-section reshape)과 spine 기반 3종(stretch, bend, twist). rib↔mesh↔spine 양방향 갱신으로 조합 가능
- Reduced dynamics: spine 점을 상태로 두고 lumped mass, Rayleigh damping, stretch + discrete-rod bending energy로 semi-implicit Euler 적분. wind, gravity, click impulse 등 외력은 W_sᵀ로 투영. mesh lift는 displacement 방식과 cylindrical(parallel-transport frame) 방식 두 가지
- 성능: 2,565개 메시 전처리 중앙값 58.0초. 편집은 8개 primitive 중 7개가 중앙값 약 1 ms(twist 12.7 ms). dynamics 적분 1.1 ms/substep, displacement lift 포함 3.0 ms, cylindrical lift 포함 25.7 ms(CPU). AMD EPYC + H100 8장 워크스테이션
- 생성: PartCrafter의 pretrained VAE latent에 OPT-350M autoregressive head를 붙여 rib/spine token을 함께 생성. CD 0.0723, F-Score 0.9118로 PartCrafter, OmniPart, PartPacker(CD 0.27~0.31)보다 좋음
- 편집 비교: ARAP, WIR3D 대비 Lap_max와 ARAP energy가 낮고 준비 시간은 2~18초(WIR3D 3.73~9.86시간)
- 로봇 학습: DexGraspNet 2.0을 Fishbone 변형 데이터(물체당 500개 변형)로 fine-tune하면 Croissant, Tuna, Cup에서 lift-and-hold 성공률 상승(multi-object에서 +11.59~+17.38%p)

## 흥미로운 점

- 하나의 제어 구조로 static 편집, reduced simulation, animation, 생성, agent 편집까지 묶은 점. W_s가 lift와 pull-back(adjoint) 연산자를 겸한다
- rib/spine에 기하 기반 이름이 붙고 파라미터가 저차원이라 LLM/VLM이 "다리 네 개를 두껍게" 같은 요청을 도구 호출로 바꿀 수 있다는 점
- shape deformation을 로봇 학습용 데이터 증강 도구로 쓰는 관점. 메시 한 개에서 많은 변형을 만드는 것이 제목의 의미
- displacement lift와 cylindrical lift의 평균 차이는 작지만(0.46%) 최악 정점 기준으로는 크다(평균 9.43%)는 분석. 굽힘·비틀림이 큰 영역에서 회전 보존이 중요함

## 한계와 의문

- triangle mesh에서만 정의됨. point cloud, 3DGS, NeRF로의 확장은 future work(원문)
- keyframe은 여전히 사람이 직접 만들어야 하고, 긴 시퀀스에서는 수고가 크다(원문)
- reduced dynamics는 "physically inspired" 수준으로, 정확한 물리 시뮬레이션과의 정량 비교는 원문에서 확인되지 않는다
- 편집 비교는 4개 메시(Dragon, Nefertiti, Chair, Spot)뿐이고 "comparable target deformation"을 어떻게 맞췄는지가 결과에 영향을 줄 수 있어 보인다
- 분기가 복잡하거나 non-manifold인 입력에서 전처리 시간이 길어지는(최대 1,143초) 경우가 실제로 얼마나 흔한지?

## 나의 한마디
{: .mine-title}

