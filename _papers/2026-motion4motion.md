---
title: "Motion4Motion: Motion Transfer Across Subjects at Inference"
short: "Motion4Motion"
authors: "Ling-Hao Chen, Zixin Yin, Duomin Wang, Xianfang Zeng, Gang Yu"
venue: "SIGGRAPH"
year: 2026
field: "Character animation"
topic: "Motion transfer"
approach: "Training-free attention control"
links:
  paper: "https://doi.org/10.1145/3799902.3811062"
  arxiv: "https://arxiv.org/abs/2607.11644"
  project: "https://lhchen.top/Motion4Motion/"
  code: ""
  video: ""
read_date: 2026-07-22
tags: [motion-transfer, video-diffusion, training-free, attention-control, cross-species]
---

## 한 줄 요약

skeleton 없이 source video의 dense point 궤적(motion flow)을 WAN DiT의 self-attention에 RoPE로 주입해, 사람→판다, 개→사자처럼 종이 다른 대상 사이에서도 학습 없이 video motion transfer를 하는 방법.

## 요약

기존 video motion transfer는 대부분 사람/인간형 캐릭터에 맞춘 skeleton 조건 학습에 의존해서, 형태가 다른 동물이나 사물로 일반화하기 어렵고 다양한 skeleton의 labeled data도 부족하다. 이 논문은 skeleton 대신 pixel 수준의 motion flow를 motion 표현으로 쓰는 training-free 프레임워크 Motion4Motion을 제안한다. source 첫 프레임의 anchor point를 diffusion feature로 target subject에 semantic matching하고, source video에서 그 점들을 tracking해 궤적을 얻은 뒤, 이 궤적을 target 점들의 목적지로 삼는다. 핵심 모듈 TransPE는 target 첫 프레임의 key/value feature를 프레임 수만큼 복제하고, 그 key에 source 궤적 좌표로 RoPE를 다시 입혀 기존 K, V 뒤에 concat한다. 그 결과 denoising 과정이 target의 외형을 궤적이 가리키는 위치에 합성하게 되고, human/animal benchmark에서 비교한 baseline들보다 모든 지표가 높게 보고된다.

## 핵심 정리

- 관찰: WAN의 3D RoPE 때문에 self-attention이 semantic 유사성보다 시공간적으로 가까운 token에 더 집중한다(Fig. 2). 그렇다면 position encoding을 바꿔 주면 feature가 "어디에 있어야 하는지"를 조작할 수 있다는 것이 출발점.
- 대응 관계 두 가지: (1) cross-image correspondence C: Grounded SAM-2 mask 안에서 source anchor point를 뽑고 diffusion feature matching으로 target 위의 대응점을 찾음, (2) source video 안에서 DIFT feature 기반 point tracking으로 motion flow M_src를 얻음. target flow는 M_tgt = M_src (M = I ∘ C⁻¹). 매칭과 tracking은 latent 해상도(시간 4배, 공간 8배 downsample)에서 수행.
- TransPE: Q는 그대로 두고, K_new = [RoPE(K), RoPE(K̂, M_tgt)], V_new = [V, V̂]. K̂, V̂는 inversion으로 캐시한 target 첫 프레임의 matched point feature를 F번 반복한 것.
- 실제 이미지 target: WAN-I2V로 영상을 만든 뒤 inversion(UniEdit-Flow)으로 초기 noise를 얻어 시작.
- 구현: WAN-14B-T2V(480p), layer [0, 40]에서 50 step 중 step 35까지 manipulation 적용. H800 GPU 1장.
- 비교 대상: MotionDirector, RoPECraft, MotionClone, FlexiAct. (본문에서는 학습 기반 trajectory 방법 Diffusion-As-Shader, WAN-Move와도 비교한다고 하지만 Table 1에는 이 둘이 없다.)
- 평가: FlexiAct의 animal 33쌍 / human 123쌍 benchmark와 자체 50쌍 animal benchmark. 지표는 TS, MF(CoTracker 기반), TC, AC, 그리고 X-Pose로 잰 Pose Similarity(PS).
- 수치(Table 1, 자체 benchmark): MF 0.448 (FlexiAct 0.384), PS 0.543 (FlexiAct 0.415). Human/Animal benchmark에서도 4개 지표 모두 최고.
- User study(10명, 50 case, Base Model 대비 pairwise): Motion Consistency 92.5 vs 7.5, Appearance Consistency 87.8 vs 12.2.
- Ablation(Fig. 7): manipulation step 0이면 feature가 이동하지 않고, 50 step 전부 적용하면 texture stretching 같은 artifact가 생겨 35가 절충점.

## 흥미로운 점

- 학습 없이 RoPE 좌표만 바꿔서 "어디에 무엇을 그릴지"를 제어한다는 발상. attention이 위치에 민감하다는 성질을 오히려 제어 손잡이로 쓴다.
- skeleton 대신 dense point trajectory를 topology-agnostic한 motion 표현으로 쓰는 점은 cross-morphology retargeting 일반에 참고할 만하다.
- Application으로 사람 걷기를 탁자에 옮기는 예시: SAM2 mask로 사람 다리와 탁자 다리를 직접 묶어("bone binding"처럼) matching 범위를 제한한다. 결국 형태가 많이 다르면 사람이 대응을 정해 줘야 한다는 점도 보여 준다.

## 한계와 의문

- 논문에 별도 limitation 절이 없다. 실패 사례는 어떤 경우일까?
- 대응점이 첫 프레임 기준으로 한 번 정해지는데, 가려짐(occlusion)이나 자세가 크게 바뀌어 보이는 부위가 바뀌는 경우에도 궤적 주입이 유지될까?
- source와 target의 신체 비율이 크게 다를 때(여우→기린) 궤적을 그대로 복사하면 M_tgt = M_src라서 target 비율에 맞는 보정은 없는 것 아닌가? 그런데도 결과가 자연스러운 이유가 base model prior 덕분인지 궁금하다.
- Diffusion-As-Shader, WAN-Move와의 비교 결과는 본문 표에서 찾을 수 없었다.
- inversion + 14B 모델 denoising 과정의 실행 시간은 보고되어 있지 않다.

## 나의 한마디
{: .mine-title}
