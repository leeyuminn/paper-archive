---
title: "PhysGaussian: Physics-Integrated 3D Gaussians for Generative Dynamics"
short: "PhysGaussian"
authors: "Tianyi Xie, Zeshun Zong, Yuxing Qiu, Xuan Li, Yutao Feng, Yin Yang, Chenfanfu Jiang"
venue: ""
year: 2023
field: "3D assets & physics"
topic: "Sim-ready assets"
approach: "MPM + 3DGS"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2311.12198"
  project: "https://xpandora.github.io/PhysGaussian/"
  code: ""
  video: ""
read_date: 2026-10-22
tags: [gaussian-splatting, material-point-method, continuum-mechanics, physics-simulation, novel-motion-synthesis]
---

## 한 줄 요약

3D Gaussian Splatting의 Gaussian kernel을 그대로 Material Point Method(MPM)의 particle로 써서, mesh 변환 없이 "보이는 것을 그대로 시뮬레이션(WS²)"하는 physics + rendering 통합 파이프라인.

## 요약

기존의 물리 기반 콘텐츠 제작은 geometry 생성 → tetrahedralization 등 simulation-ready 변환 → 시뮬레이션 → 렌더링의 다단계 과정이라 중간 단계에서 불일치가 생기고, NeRF 계열 편집도 결국 mesh나 cage에 렌더링 geometry를 embedding해야 했다. PhysGaussian은 정적 장면을 3DGS로 복원한 뒤, 각 Gaussian을 continuum의 이산화 단위로 보고 custom MPM으로 위치·속도·deformation gradient를 시간에 따라 진화시킨다. 변형된 Gaussian은 deformation gradient로 covariance를 갱신하고 spherical harmonics 방향까지 회전시켜 바로 splatting으로 렌더링한다. 탄성체, 소성 금속, 파괴, 모래, 점소성 페이스트, 충돌 등 다양한 재질을 다루며, lattice deformation 벤치마크에서 NeRF 기반 편집 방법들보다 높은 PSNR을 보인다.

## 핵심 정리

- Gaussian 변형: 각 particle이 국소적으로 affine 변환을 겪는다고 1차 근사하면 변형된 kernel도 Gaussian으로 유지된다. 위치는 x_p(t)=φ(X_p,t), covariance는 a_p(t)=F_p A_p F_pᵀ. opacity와 SH 계수는 고정
- SH 회전: deformation gradient의 polar decomposition F=RS에서 R을 얻어 view direction에 역회전을 적용(물체가 돌아도 외관이 일관되게)
- Incremental 버전: 전체 F 없이 속도 gradient로 covariance와 회전을 step마다 갱신하는 대안도 제시(F를 strain으로 쓰지 않는 재질 모델용)
- Internal filling: 3DGS는 표면에만 Gaussian이 몰려 내부가 비어 있으므로, opacity field를 grid로 만들고 6방향 ray 교차 조건으로 내부 cell을 찾아 particle을 채움. 채우지 않으면 중력만으로도 물체가 무너짐
- Anisotropy regularizer: 장축/단축 비율이 r을 넘지 않도록 하는 loss로, 큰 변형 시 가늘고 긴 kernel이 튀어나오는 artifact 완화
- 재질 모델: metal은 von-Mises, sand는 Drucker-Prager, paste는 Herschel-Bulkley plasticity. 파괴와 충돌은 MPM이 자연스럽게 처리
- 데이터/환경: BlenderNeRF 합성(sofa suite), Instant-NGP의 fox, Nerfstudio의 plane, DroneDeploy의 ruins, 직접 iPhone으로 찍은 toast/jam(각 150장). RTX 3090. plane 30 FPS, toast 25 FPS, jam 36 FPS로 일부 장면은 실시간
- 비교: NeRF-Editing, Deforming-NeRF, PAC-NeRF와 bend/twist lattice 변형 벤치마크(wolf, stool, plant)에서 6개 케이스 모두 최고 PSNR(예: Stool bend 31.15 vs 차순위 기존 방법 25.00)
- Ablation: Fixed covariance, Rigid covariance, Fixed harmonics 모두 full 모델보다 PSNR이 낮음

## 흥미로운 점

- 렌더링 표현과 시뮬레이션 표현을 하나로 통일해 embedding/meshing 단계를 없앤 "what you see is what you simulate" 철학
- deformation gradient(1차 정보)를 렌더링 쪽에도 그대로 써서 kernel 모양과 SH 방향까지 바꾼다는 점. 기존 dynamic GS는 kernel 모양을 고정하거나 학습으로 바꿨다
- geometry 기반 ARAP 편집과 달리 volume conservation 같은 물리적 성질이 자연스럽게 따라온다

## 한계와 의문

- 그림자 변화는 고려하지 않고, 재질 파라미터는 사람이 수동으로 설정한다(원문 Limitation). 영상에서 differentiable MPM으로 자동 추정하는 방향을 제안함
- 시뮬레이션 영역 선택과 particle 속도 조작도 수동이다. 사용자 제어를 어떻게 더 직관적으로 만들 수 있을까?
- internal filling으로 채운 particle은 가장 가까운 Gaussian의 색을 물려받는데, 파괴처럼 내부가 드러나는 경우 외관이 얼마나 그럴듯한지 정량 평가는 없다
- 액체 같은 재질은 future work로 남음
- 원문(arXiv v3)에 학회 표기가 없어 venue는 비워 두고 year는 arXiv ID(2311) 기준 2023으로 적음

## 나의 한마디
{: .mine-title}

