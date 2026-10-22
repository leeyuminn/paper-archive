---
title: "DiVAS: Video and Audio Synchronization with Dynamic Frame Rates"
short: "DiVAS"
authors: "Clara Fernandez-Labrador, Mertcan Akçay, Eitan Abecassis, Joan Massich, Christopher Schroers"
venue: "CVPR"
year: 2024
field: "Image & video generation"
topic: "Audio-video synchronization"
approach: "Transformer 기반"
links:
  paper: ""
  arxiv: ""
  project: ""
  code: ""
  video: ""
read_date: 2026-10-22
tags: [lip-sync, audio-visual, transformer, contrastive-learning, active-speaker-detection]
---

## 한 줄 요약

원본 frame rate와 sample rate를 그대로 받는 순수 Transformer 모델로, 영화·방송 같은 실제 제작 환경에서 lip sync 기반 audio-video 동기화 오류를 빠르고 정확하게 찾아낸다.

## 요약

기존 lip sync 모델(SyncNet, VocaLiST 등)은 CNN encoder 때문에 입력 크기가 고정되어 영상을 25 fps로 변환하고 face crop, MFCC 같은 전처리를 거쳐야 했고, 깨끗한 단일 화자 데이터셋(LRS2/LRS3)에서만 잘 동작했다. DiVAS는 raw video frame과 raw audio waveform을 각각 patch로 나눠 modality별 Transformer(3D ViT, 1D Transformer)에 넣고, 두 표현을 공통 공간으로 투영해 contrastive loss로 in-sync/out-of-sync를 구분한다. 고정 0.2초 구간에 대해 frame 수와 sample 수가 원본 사양에 따라 달라지도록 하고, 실제 timestamp를 반영한 time-aware positional encoding으로 audio와 video를 같은 시간 축에 맞춘다. face crop뿐 아니라 full frame 입력도 가능해 face detection/tracking 비용을 없앨 수 있고, clip 단위 예측을 RANSAC으로 모아 영화 한 편(title) 단위의 constant offset·drift까지 판별한다.

## 핵심 정리

- 구조: video는 3D Vision Transformer(patch 16×16×1), audio는 raw waveform을 patch(s=128)로 나눈 1D Transformer. 각각 3층, 3 head, MLP 1024. modality token을 FC layer로 공통 공간에 투영 후 margin m=20의 contrastive loss로 학습
- 학습: negative sample은 50% 확률로 audio를 앞/뒤로 인위적으로 밀어서 생성(최소 1 frame ~ clip 길이까지)
- Time-aware positional encoding: 3D sinusoidal encoding의 시간 축 index에 frame rate(video), sample rate(audio)에 따른 스케일 인자를 곱해 실제 시간 간격을 반영
- 평가 프로토콜: SyncNet식 sliding window로 offset별 distance를 계산해 최솟값으로 offset 추정, confidence = median(D) − min(D). 무작위 artificial offset을 넣어 테스트하고, tolerance를 ±40 ms 외에 ITU 기준 undetectable [-125, 45] ms, acceptable [-185, 95] ms로도 보고
- LRS2: DiVAS 99.4/99.4/99.5%로 SyncNet(99.4%)과 비슷하지만 파라미터 4.8M(SyncNet 13.6M, VocaLiST 80.1M), 속도 4500 FPS(SyncNet 265, VocaLiST 13)
- LRS3-multfps(23.976~60 fps 원본 유지): 30 fps 이하로 학습 후 59.94/60 fps에 테스트하면 일반 positional encoding 모델은 ±40 ms에서 82.2%, DiVAS는 96.8%
- 자체 구축 데이터셋(170개 title, 21.8만 dialog scene, 약 140시간, 실사·애니메이션·뮤지컬 등): LRS2 학습 모델은 일반화가 약하고, 새 데이터로 학습하면 clip 단위 89.4/93.7/97.0%, title 단위 93.5/96.4/99.4%
- Full frame 버전(DiVAS-frame)은 face crop 버전보다 약간 낮은 정확도(93.6 vs 94.4%)지만 전처리가 약 30배 빠름(317 vs 9.4 FPS). Iashin et al.과 21-class 프로토콜 비교 시 tolerance 없이 92.2% vs 80.7%
- Active Speaker Detection: confidence 값을 speaker 판별에 그대로 사용. 새 데이터 학습 시 F1 평균 84.8, 다중 화자(MS) 장면이 가장 어려움(70.6)

## 흥미로운 점

- 별도 ASD 모듈 없이, 동기화 모델의 confidence(정렬 peak가 뚜렷한지)만으로 누가 말하는지 판별한다는 점
- frame rate 변환 자체가 sync artifact를 만들 수 있다는 문제의식에서 "원본 사양 그대로 입력"을 설계 목표로 둔 점. 가변 길이 입력이 가능한 Transformer의 장점을 positional encoding 쪽에서 살렸다
- full frame 학습 초반에 self-attention이 입보다 손 움직임에 쏠린다는 관찰
- clip 단위 예측을 RANSAC 회귀로 묶어 drift(시간에 따라 offset이 커짐)와 constant offset을 구분하는 title 단위 분석, 그리고 품질 관리팀용 sync timeline 시각화

## 한계와 의문

- 음성(lip sync)에 한정된 cue만 다룬다. 원문도 transient sound 등 일반 소리로의 확장을 future work로 남김
- 다중 화자 장면은 clip 전체 평균을 쓰기 때문에 짧게 말하는 사람에게 불리하다고 원문이 설명. 화자 전환이 잦은 장면에서는 어떻게 개선할 수 있을까?
- 자체 데이터셋(170 title)은 공개 여부가 원문에 나오지 않아 재현성 확인이 어렵다
- title 단위 평가에서 intermittent offset은 문제 유형으로 언급되지만 실험에서 어떻게 다뤄졌는지는 원문에서 확인되지 않는다
- tolerance 표기가 본문은 [-185, 95] ms, 표 캡션은 [-185, 90] ms로 서로 다르다. 어느 쪽이 실제 평가 기준인지?

## 나의 한마디
{: .mine-title}

