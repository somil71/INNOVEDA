from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


def training_data():
    # Small synthetic dataset for localhost prototype.
    mild = [
        "mild cold slight cough",
        "light headache no fever",
        "minor body pain after work",
        "low appetite mild weakness",
    ]
    moderate = [
        "high fever for three days with cough",
        "vomiting and dizziness",
        "infection symptoms with body pain",
        "persistent cough and fatigue",
    ]
    critical = [
        "chest pain with breathless condition",
        "patient unconscious and seizure",
        "heavy bleeding and dizziness",
        "stroke signs facial droop speech issues",
    ]
    x = mild + moderate + critical
    y = (["mild"] * len(mild)) + (["moderate"] * len(moderate)) + (["critical"] * len(critical))
    return x, y


def train_and_save(output_path: Path):
    x, y = training_data()
    pipeline = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000)),
        ]
    )
    pipeline.fit(x, y)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_path)
    print(f"Model saved to: {output_path}")


if __name__ == "__main__":
    model_path = Path(__file__).resolve().parent / "triage_model.joblib"
    train_and_save(model_path)
