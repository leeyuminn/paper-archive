---
title: "A Generative Motion Rig for Artist-Driven Motion Authoring"
short: "GMR"
authors: "Jakob Buhmann, Dhruv Agrawal, Dominik Borer, Luca Vögeli, Robert W. Sumner, Martin Guay"
venue: "SIGGRAPH Talks"
year: 2026
field: "Character animation"
topic: "Motion authoring"
approach: "Generative motion rig"
links:
  paper: "https://doi.org/10.1145/3799818.3812088"
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [motion-authoring, generative-keyframing, in-betweening, blender, animation-tools]
---

## 한 줄 요약

generative motion model(IBMM)을 Blender 플러그인 형태의 "Generative Motion Rig"로 감쌌다. 아티스트가 sparse keyframe, Neural Motion Curve 드래그, noise 재샘플링으로 motion을 만드는 "generative keyframing" 워크플로를 제안하고 실제 사용 사례를 공유하는 3쪽짜리 talk이다.

## 요약

generative motion model 연구는 많지만 실제 애니메이션 툴에 통합된 사례는 드물다. GMR은 client-server 구조를 쓴다. Blender(client)가 keyframe, 제약, noise를 GPU 서버로 보내면, 서버에서 ML-Poser(neural IK)가 sparse joint 제약으로 full-body pose를 완성하고 ML-Betweener(IBMM, Bézier 기반 diffusion motion model)가 전체 motion을 생성해 돌려준다. 아티스트는 posing handle과 Neural Motion Curve(NMC)의 control point를 직접 조작한다. 그 밖에 제약 시점 이동으로 속도 조절, seed noise 재샘플링, 제약 바깥으로 motion extension, mocap 편집(inpainting으로 base motion 유지)을 할 수 있다. traditional rig와의 rig switching과 animation layer도 지원해 기존 파이프라인과 섞어 쓸 수 있다. 전문 아티스트와 비전문가 테스트에서 각자 다른 워크플로로 과제를 완성했다.

## 핵심 정리

- **구조**: client-server 분리로 호스트 소프트웨어의 제한된 개발 환경과 모델 실행을 떼어 놓았다. 다른 툴(Maya 등)로 client를 바꾸기 쉽다. 저자들은 IBMM 외의 generative motion engine(Cohan et al. 2024 등)과도 호환된다고 한다.
- **조작 수단**: sparse joint 제약과 full-body keyframe을 섞어 쓴다. 발 제약을 옮기면 발 패턴이 바뀌고, hip 제약 하나를 회전시키면 걷기가 회전·넘어짐 동작으로 바뀐다. noise 재샘플링은 위치 성분을 바꾸면 전체 윤곽이, 방향 성분을 바꾸면 그 시점의 pose만 바뀐다.
- **Temporal control**: 제약을 타임라인에서 앞으로 당기면 그 앞 구간 동작이 빨라진다(걷기가 sprint로 바뀜).
- **Motion editing**: base motion을 서버로 보내면 diffusion 과정이 custom inpainting으로 base motion을 따라가도록 guide된다. 유지할 구간과 새로 생성할 구간을 지정할 수 있어 mocap stitching, extension, 수정이 가능하다(Synth2Track으로 캡처한 점프의 거리를 바꾸고 뒷걸음 추가).
- **Rig switching**: traditional rig에서 GMR로 넘어갈 때는 현재 pose를 full-body 제약으로 추가한다. GMR에서 traditional rig로 넘어갈 때는 매 프레임 키가 박히면 편집이 불가능해지므로 현재 pose만 옮긴다. synchronize mode도 있다.
- **사용 테스트**:
  - Freestyle: 전문 아티스트가 22초짜리 추격 장면을 툴 학습과 스토리보드를 포함해 2일 이내에 제작했다.
  - Guided test: 파쿠르 코스의 45초 애니메이션을 1.5시간 안에 만드는 과제. 비전문가(저자)는 NMC를 모두 띄우고 full-body와 sparse 제약을 섞어 썼고, 전문가는 ML-Poser로 full-body keyframe을 먼저 깔고 sparse 제약은 마무리에만 썼다.

## 흥미로운 점

- 연구 모델을 실제 툴에 넣을 때 생기는 UX 문제를 구체적으로 다룬다. 예를 들어 GMR에서 traditional rig로 전환할 때 "전체가 아니라 현재 pose만 넘긴다"는 결정이 그렇다.
- window length나 noise sampling이 결과에 영향을 주는 방식이 아티스트에게 낯설다는 피드백. generative 툴에서 새로 생기는 조작 개념에 대한 교육과 UI가 필요하다는 점을 보여준다.
- 같은 툴인데도 사용자 숙련도에 따라 워크플로가 자연스럽게 갈렸다는 관찰.

## 한계와 의문

- 저자들이 밝힌 과제: 학습 데이터 밖의 동작(비물리적, 과장된 스타일)은 어렵다. generative layer와 traditional layer를 일관성 있게 섞는 방법이 남아 있다. 이전에 예측된 pose를 제약으로 다시 넣으면 생성 결과가 바뀌어 synchronize mode에서 pop이 생긴다(제약 추가 시 안정성 부족). 복잡한 rig나 다른 morphology로 확장하는 문제도 남아 있다.
- 3쪽 talk이라 정량 평가가 없고, 사용자 테스트도 2명 수준이다. 서버 응답 latency나 인터랙티브 반응 속도는 언급되지 않는다.
- IBMM과 NMC(SKEL-Betweener)의 세부 구조는 이 논문에 없고 참고문헌(Vögeli et al. 2025, Agrawal et al. 2024)을 봐야 한다.

## 나의 한마디
{: .mine-title}

