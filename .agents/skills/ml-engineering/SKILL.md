---
name: ml-engineering
description: >-
  ML pipeline design, feature engineering, model training/serving, experiment
  tracking, model validation, and MLOps principles.
---

# ML Engineering Principles

Guidelines for building reliable, reproducible machine learning systems.

## When to Invoke
- Designing ML pipelines (training, serving)
- Feature engineering and data preparation
- Model evaluation and validation
- MLOps infrastructure decisions

## ML Pipeline Design

### Stages
```
Data Collection → Feature Engineering → Training → Evaluation → Deployment → Monitoring
```

### Principles
1. **Reproducibility** — versioned data, code, and config. Same inputs = same model.
2. **Experiment tracking** — every run logged (MLflow, W&B, Neptune).
3. **Feature stores** — centralized feature computation, reusable across models.
4. **Model registry** — versioned models with metadata, promotion workflow.

## Feature Engineering

1. **Compute features once, reuse everywhere** — feature store pattern.
2. **Training-serving skew prevention** — same transformation code in training and inference.
3. **Feature documentation** — every feature has description, source, freshness requirement.

## Model Validation

### Checklist
- [ ] Performance metrics meet threshold (accuracy, F1, AUC, etc.)
- [ ] No data leakage (target info in features)
- [ ] Fairness evaluation across protected groups
- [ ] Performance on edge cases and out-of-distribution data
- [ ] Latency meets serving SLA
- [ ] Model size within deployment constraints

## Model Serving

| Pattern | When |
|---|---|
| **Batch inference** | Scheduled predictions, large volumes, latency-tolerant |
| **Real-time API** | Low-latency, per-request predictions |
| **Streaming** | Continuous predictions on event streams |
| **Edge** | On-device, offline-capable |

## Monitoring

1. **Data drift detection** — statistical tests on input distributions.
2. **Model performance monitoring** — track prediction accuracy over time.
3. **Feature importance drift** — alert when feature contributions shift.
4. **Automated retraining triggers** — retrain when performance degrades below threshold.

## Tools Ecosystem

| Category | Tools |
|---|---|
| Experiment tracking | MLflow, Weights & Biases, Neptune |
| Feature stores | Feast, Tecton, Hopsworks |
| Model registry | MLflow, Vertex AI, SageMaker |
| Data versioning | DVC, LakeFS |
| Pipeline orchestration | Kubeflow, Vertex AI Pipelines, Airflow |

## Related
- Data Engineering @.agents/skills/data-engineering/SKILL.md
- Python Idioms @.agents/skills/python-idioms/SKILL.md
- Performance Optimization Principles @.agents/rules/performance-optimization-principles.md
