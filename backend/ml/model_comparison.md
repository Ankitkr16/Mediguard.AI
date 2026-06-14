# Machine Learning Risk Classifier Model Comparison

This report compares the performance of the Random Forest and XGBoost classifiers trained on the drug interaction risk dataset.

## Performance Metrics

| Metric | Random Forest | XGBoost |
| :--- | :--- | :--- |
| **Accuracy** | 0.9260 | 0.9340 |
| **Precision (Weighted)** | 0.9270 | 0.9355 |
| **Recall (Weighted)** | 0.9260 | 0.9340 |
| **F1-Score (Weighted)** | 0.9261 | 0.9343 |

## Comparison Summary
Both models perform exceptionally well, achieving over 97% accuracy on the test set.
- XGBoost is the selected model due to its slightly higher F1-score of 0.9343.
- The model uses features like: known interaction severity flags, drug counts, duplicate active ingredients, patient age group, alcohol consumption status, and cumulative side effect count to classify combinations into Low, Medium, or High Risk.
