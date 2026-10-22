---
title: "Reenact Anything: Semantic Video Motion Transfer Using Motion-Textual Inversion"
short: "Reenact"
authors: "Manuel Kansy, Jacek Naruniec, Christopher Schroers, Markus Gross, Romann M. Weber"
venue: ""
year: 2024
field: "Image & video generation"
topic: "Video motion control"
approach: "Embedding inversion"
links:
  paper: ""
  arxiv: "https://arxiv.org/abs/2408.00458"
  project: "https://mkansy.github.io/reenact-anything/"
  code: ""
  video: ""
read_date: 2026-10-22
tags: [motion-transfer, image-to-video, textual-inversion, reenactment, video-diffusion]
---

## 한 줄 요약

Frozen image-to-video 모델(SVD)의 cross-attention 입력 embedding을 reference video 하나에 대해 최적화(motion-textual inversion)해서, 위치가 맞지 않는 target image에도 "의미상 같은" 움직임을 옮기는 방법.

## 요약

목표는 semantic video motion transfer: motion reference video의 움직임 의미(예: jumping jacks)를 target image의 외형과 레이아웃을 유지한 채 재현하는 것이다. 주요 난제는 reference의 appearance leakage와 두 입력 간 object misalignment다. 저자들은 image-to-video 모델에서 외형은 주로 image latent 입력이, 움직임은 cross-attention으로 들어가는 text/image embedding이 결정한다는 관찰(실제 말과 장난감 말의 CLIP embedding을 바꾸면 움직임도 바뀜)에 기반해, 모델 weight는 고정하고 spatial 차원이 없는 embedding token들만 diffusion loss로 최적화한다. Embedding을 frame마다 다른 token 여러 개로 inflation해서 시간적으로 세밀한 motion을 담는다. Something-Something V2 기반 평가에서 VideoComposer, MotionClone, MotionDirector보다 motion fidelity가 크게 높았다.

## 핵심 정리

- **Motion-textual inversion**: SVD(14-frame)의 CLIP image embedding 자리를 학습 가능한 motion-text embedding m*로 바꾸고, reference video 한 개에 대해 표준 diffusion loss로 m*만 최적화. 추론 시에는 target image를 첫 프레임으로 넣고 m*를 조건으로 생성.
- **Embedding inflation**: 원래 SVD는 image embedding이 1 token이라 cross-attention이 사실상 벡터 하나를 더하는 연산으로 퇴화. 이를 spatial cross-attention용 F×N token(frame마다 다른 token) + temporal cross-attention용 N token, 총 (F+1)×N token으로 확장. 기본값 N=5, F=14 → 75 token.
- **Ablation**: token 수만 늘리는 것보다 frame별로 다른 token을 두는 것이 가장 큰 개선. N을 더 키우면 조금 좋아지다가 포화.
- **평가 설정**: Something-Something V2에서 10개 class(camera motion 5, object motion 5), class마다 reference 1개 + target 10개 → 방법당 100개 영상. Appearance는 CLIP 유사도, motion은 action recognition network의 Top-1/Top-5 정확도와 logit cosine similarity로 측정.
- **결과 (Table 1)**: Ours Acc-Top-1 54% / Top-5 76% / Cos-Sim 0.696 vs. VideoComposer 44% / 62% / 0.497, MotionClone 37% / 62% / 0.523, MotionDirector 31% / 58% / 0.523. 27명 user study에서 motion fidelity와 overall 평균 순위 1위(각각 75%, 78% 비율로 best 선택). Appearance 보존은 SVD baseline 바로 뒤(이 지표는 움직임이 적을수록 유리하다고 저자들이 언급).
- **비용**: motion 하나당 A100(80GB)에서 약 1시간 최적화, 영상 1개 추론은 1분 미만.

## 흥미로운 점

- "단어는 motion을 설명하기 부적합하지만, 그 embedding은 motion을 아주 잘 표현한다"는 관찰. Spatial 차원이 없는 표현이라 정렬 문제를 애초에 피한다.
- Fine-tuning 대신 frozen I2V 모델을 쓰는 것만으로 appearance leakage를 막는다는 설계가 단순하다.
- 여러 객체에 동시에 motion이 적용되고, stick figure 같은 hand-crafted motion도 옮길 수 있다. Full-body / face reenactment, camera motion을 한 방법으로 다룬다.
- 학습된 embedding을 unconditional로 생성해 motion을 시각화하는 방법.

## 한계와 의문

- 저자들이 밝힌 한계: SVD의 prior와 품질을 그대로 물려받음(identity 변화 등), domain 차이가 크면 reference의 구조가 새어 나옴(캥거루 다리가 사람처럼), 세밀한 motion(타이핑하는 손 등)은 잘 안 옮겨짐.
- Target image가 reference video의 첫 프레임과 시간적으로 맞아야 한다(task 정의상 제약).
- Motion마다 약 1시간 최적화가 필요하다. Reference video에서 embedding을 바로 예측하는 feed-forward 방식, 더 긴 영상, DiT 기반 모델로의 확장은 future work로 남김.
- 평가가 Something-Something V2의 10개 class로 규모가 작다. 더 다양한 motion 종류에서도 같은 경향일까?

## 나의 한마디
{: .mine-title}

