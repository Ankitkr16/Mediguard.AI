# Curated local medicine database for risk lookup, duplicates checking, and allergy alerts.
# Normalizes drug names to lowercase for searching.

DRUG_DATABASE = {
    "paracetamol": {
        "active_ingredients": ["paracetamol"],
        "category": "Analgesic & Antipyretic",
        "purpose": "Relief of mild to moderate pain (headache, muscle ache, backache, arthritis) and reduction of fever.",
        "side_effects": {
            "common": ["Nausea", "Headache", "Insomnia"],
            "rare": ["Skin rash", "Itching", "Allergic reaction"],
            "serious": ["Severe abdominal pain", "Dark urine", "Yellowing eyes/skin (Jaundice)"],
            "emergency": ["Acute liver failure", "Severe allergic reaction (Anaphylaxis)", "Swelling of face/lips/throat"]
        },
        "food_interactions": [
            "Limit high pectin foods (jelly, apples) as they can delay paracetamol absorption.",
            "Avoid taking on an empty stomach if you experience nausea."
        ],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Increased risk of severe hepatotoxicity (liver damage).",
            "warnings": "Do not consume alcohol while taking paracetamol. Chronic alcohol consumption increases liver toxicity risk even at therapeutic doses."
        },
        "precautions": [
            "Maximum daily dose for adults is 4000mg (4g) from all sources.",
            "Check other cough/cold medicines to avoid accidental double-dosage (Paracetamol overdose)."
        ]
    },
    "crocin": {
        "active_ingredients": ["paracetamol"],
        "category": "Analgesic & Antipyretic",
        "purpose": "Common brand of Paracetamol used for reducing pain and fever.",
        "side_effects": {
            "common": ["Nausea", "Headache"],
            "rare": ["Skin rash", "Itching"],
            "serious": ["Dark urine", "Liver function abnormalities"],
            "emergency": ["Anaphylaxis", "Swelling of throat"]
        },
        "food_interactions": ["Limit pectin-rich foods."],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Risk of liver toxicity.",
            "warnings": "Do not mix with alcohol."
        },
        "precautions": ["Do not take with other Paracetamol containing medicines like Calpol or Dolo."]
    },
    "dolo": {
        "active_ingredients": ["paracetamol"],
        "category": "Analgesic & Antipyretic",
        "purpose": "High-strength Paracetamol (typically Dolo 650) used for fever and moderate pain relief.",
        "side_effects": {
            "common": ["Nausea", "Dizziness"],
            "rare": ["Skin rash"],
            "serious": ["Liver enzyme elevation", "Jaundice"],
            "emergency": ["Anaphylaxis"]
        },
        "food_interactions": ["Limit pectin-rich foods."],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "High risk of liver damage.",
            "warnings": "Avoid alcohol completely."
        },
        "precautions": ["Do not take with other Paracetamol formulations to avoid exceeding 4g daily."]
    },
    "calpol": {
        "active_ingredients": ["paracetamol"],
        "category": "Analgesic & Antipyretic",
        "purpose": "Brand of Paracetamol commonly used for pain relief and fever in children and adults.",
        "side_effects": {
            "common": ["Nausea", "Stomach upset"],
            "rare": ["Allergic rash"],
            "serious": ["Hepatotoxicity at high doses"],
            "emergency": ["Severe allergic reaction"]
        },
        "food_interactions": ["Limit pectin-rich foods."],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Liver damage risk.",
            "warnings": "Avoid alcohol."
        },
        "precautions": ["Keep out of reach of children and follow exact weight-based dosing."]
    },
    "ibuprofen": {
        "active_ingredients": ["ibuprofen"],
        "category": "Nonsteroidal Anti-inflammatory Drug (NSAID)",
        "purpose": "Reducing hormones that cause pain and inflammation in the body. Used for arthritis, menstrual cramps, toothache, and minor injuries.",
        "side_effects": {
            "common": ["Stomach upset", "Heartburn", "Nausea", "Dizziness", "Mild headache"],
            "rare": ["Ringing in ears (Tinnitus)", "Fluid retention/Swelling"],
            "serious": ["Gastrointestinal bleeding", "Stomach ulcers", "Kidney impairment", "Increased blood pressure"],
            "emergency": ["Black/tarry stools", "Vomiting blood", "Chest pain", "Shortness of breath", "Sudden weakness/slurred speech"]
        },
        "food_interactions": [
            "Take with food or milk to minimize gastrointestinal upset.",
            "Avoid taking with other NSAIDs (Aspirin, Naproxen) due to increased bleeding risk."
        ],
        "alcohol_interaction": {
            "risk_level": "Medium",
            "effects": "Increased risk of stomach irritation, ulcers, and gastrointestinal bleeding.",
            "warnings": "Limit or avoid alcohol. Consuming alcohol while taking NSAIDs irritates the stomach lining significantly."
        },
        "precautions": [
            "Do not use right before or after heart bypass surgery.",
            "Use with caution in elderly patients and those with a history of stomach ulcers or kidney disease."
        ]
    },
    "combiflam": {
        "active_ingredients": ["ibuprofen", "paracetamol"],
        "category": "Combination Analgesic & NSAID",
        "purpose": "Used for relief of severe headache, muscular pain, joint pain, and dental pain.",
        "side_effects": {
            "common": ["Heartburn", "Stomach pain", "Nausea", "Drowsiness"],
            "rare": ["Skin peeling", "Bloated feeling"],
            "serious": ["Gastric ulceration", "Liver dysfunction", "Reduced kidney function"],
            "emergency": ["Severe GI bleeding (black stools)", "Anaphylaxis", "Liver failure"]
        },
        "food_interactions": ["Take with food to protect the stomach lining from ibuprofen irritation."],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Combined risk of stomach bleeding (NSAID) and liver toxicity (paracetamol).",
            "warnings": "Avoid alcohol entirely when taking Combiflam."
        },
        "precautions": [
            "Contains both Ibuprofen and Paracetamol. Do not take extra doses of either drug separately.",
            "Contraindicated in patients with active peptic ulcers or asthma triggered by NSAIDs."
        ]
    },
    "aspirin": {
        "active_ingredients": ["aspirin"],
        "category": "NSAID / Antiplatelet (Blood Thinning)",
        "purpose": "Fever reducer, pain reliever, anti-inflammatory, and blood thinner to prevent heart attacks and strokes.",
        "side_effects": {
            "common": ["Indigestion", "Nausea", "Easy bruising", "Increased bleeding"],
            "rare": ["Hives", "Runny nose"],
            "serious": ["Stomach ulcers", "Tinnitus (ringing in ears)", "Internal bleeding", "Reye's syndrome in children"],
            "emergency": ["Coughing up blood", "Vomiting blood", "Severe abdominal pain", "Loss of consciousness"]
        },
        "food_interactions": [
            "Take with food to reduce stomach upset.",
            "Avoid garlic, ginger, ginkgo biloba, and high amounts of Vitamin E as they may increase bleeding risks."
        ],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Dramatically increases the risk of stomach bleeding and ulcers.",
            "warnings": "Avoid alcohol. The combined antiplatelet effect of aspirin and alcohol increases bleeding tendency."
        },
        "precautions": [
            "Never give aspirin to children or teenagers with fever or flu due to the risk of Reye's Syndrome (fatal liver/brain swelling).",
            "Inform surgeons or dentists that you take Aspirin before any procedure."
        ]
    },
    "warfarin": {
        "active_ingredients": ["warfarin"],
        "category": "Anticoagulant (Blood Thinning)",
        "purpose": "Prevention and treatment of blood clots (deep vein thrombosis, pulmonary embolism) and stroke prevention in patients with atrial fibrillation.",
        "side_effects": {
            "common": ["Easy bruising", "Minor nosebleeds", "Bleeding gums", "Prolonged bleeding from cuts"],
            "rare": ["Hair loss", "Cold sensitivity", "Skin necrosis (rare tissue death)"],
            "serious": ["Major hemorrhage", "Severe internal bleeding", "Blood in urine or stool", "Severe headache"],
            "emergency": ["Uncontrolled bleeding", "Vomiting coffee-ground material", "Severe dizziness or fainting", "Purple toes syndrome"]
        },
        "food_interactions": [
            "Maintain a consistent intake of Vitamin K-rich foods (spinach, kale, broccoli, brussels sprouts). Sudden increases in Vitamin K lower Warfarin efficacy, while decreases raise bleeding risk.",
            "Avoid cranberry juice, grapefruit, and herbal supplements (St. John's wort, garlic) as they alter drug levels."
        ],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Alters Warfarin metabolism, leading to unpredictable INR levels and extremely high risk of severe internal bleeding.",
            "warnings": "Avoid alcohol. Binge drinking can significantly increase bleeding risk, while chronic drinking can decrease drug effectiveness."
        },
        "precautions": [
            "Requires regular blood testing (PT/INR) to monitor clotting time.",
            "Avoid contact sports or activities that pose a high risk of injury/bleeding."
        ]
    },
    "metformin": {
        "active_ingredients": ["metformin"],
        "category": "Oral Antidiabetic (Biguanide)",
        "purpose": "Lowering blood glucose levels in Type 2 Diabetes patients by reducing liver glucose production and improving insulin sensitivity.",
        "side_effects": {
            "common": ["Diarrhea", "Nausea", "Stomach ache", "Metallic taste in mouth", "Loss of appetite"],
            "rare": ["Vitamin B12 deficiency", "Mild skin flushing"],
            "serious": ["Lactic Acidosis (rare but fatal buildup of lactic acid in blood)", "Hypoglycemia (when combined with insulin/sulfonylureas)"],
            "emergency": ["Extreme tiredness", "Severe muscle pain", "Breathing difficulty", "Slow or irregular heartbeat", "Severe vomiting/diarrhea"]
        },
        "food_interactions": [
            "Take with meals to minimize gastrointestinal side effects (especially diarrhea).",
            "Ensure adequate hydration to protect kidney function."
        ],
        "alcohol_interaction": {
            "risk_level": "High",
            "effects": "Greatly increases the risk of Lactic Acidosis (a life-threatening medical emergency) and can cause severe hypoglycemia.",
            "warnings": "Do not consume alcohol while taking Metformin. Alcohol inhibits lactate clearance, promoting lactic acid buildup."
        },
        "precautions": [
            "Contraindicated in severe kidney disease (eGFR < 30 mL/min).",
            "Must be temporarily discontinued before and 48 hours after receiving iodinated contrast dye for CT scans/X-rays."
        ]
    },
    "lisinopril": {
        "active_ingredients": ["lisinopril"],
        "category": "ACE Inhibitor (Antihypertensive)",
        "purpose": "Lowering blood pressure, treating heart failure, and improving survival after a heart attack.",
        "side_effects": {
            "common": ["Dry cough (chronic)", "Dizziness", "Headache", "Fatigue"],
            "rare": ["Rashes", "Loss of taste"],
            "serious": ["Hyperkalemia (high potassium levels)", "Kidney function decline", "Severe hypotension (low blood pressure)"],
            "emergency": ["Angioedema (swelling of face, lips, tongue, or throat causing airway obstruction)", "Difficulty breathing", "Fainting"]
        },
        "food_interactions": [
            "Avoid potassium supplements or salt substitutes containing potassium, as Lisinopril raises blood potassium (risk of heart rhythm issues).",
            "Drink plenty of water; dehydration can lead to severe drops in blood pressure."
        ],
        "alcohol_interaction": {
            "risk_level": "Medium",
            "effects": "Additive blood-pressure lowering effect, leading to orthostatic hypotension (severe dizziness, lightheadedness, or fainting upon standing).",
            "warnings": "Limit alcohol. Stand up slowly from sitting or lying positions to avoid fainting."
        },
        "precautions": [
            "Strictly contraindicated during pregnancy due to high risk of fetal toxicity/death.",
            "Monitor kidney function and potassium levels regularly."
        ]
    },
    "azithromycin": {
        "active_ingredients": ["azithromycin"],
        "category": "Macrolide Antibiotic",
        "purpose": "Treating bacterial infections including respiratory tract infections, skin infections, ear infections, and sexually transmitted diseases.",
        "side_effects": {
            "common": ["Diarrhea", "Nausea", "Abdominal pain", "Vomiting"],
            "rare": ["Altered sense of taste", "Sun sensitivity"],
            "serious": ["QT Prolongation (abnormal heart rhythm)", "Hepatotoxicity (liver damage)", "Clostridioides difficile-associated diarrhea (severe colitis)"],
            "emergency": ["Severe palpitations", "Chest pain", "Fainting", "Severe skin reactions (Stevens-Johnson syndrome)", "Anaphylaxis"]
        },
        "food_interactions": [
            "Can be taken with or without food. Taking with food reduces stomach upset.",
            "Avoid taking aluminum or magnesium-containing antacids at the same time, as they delay absorption."
        ],
        "alcohol_interaction": {
            "risk_level": "Medium",
            "effects": "May delay the absorption of the antibiotic and exacerbate stomach side effects like nausea or diarrhea. Also increases liver stress.",
            "warnings": "Avoid alcohol. Alcohol dehydrates the body and impairs the immune system while fighting bacterial infections."
        },
        "precautions": [
            "Do not use in patients with a history of QT prolongation, low potassium, or slow heart rate.",
            "Complete the full prescribed course of antibiotics even if symptoms improve."
        ]
    },
    "amoxicillin": {
        "active_ingredients": ["amoxicillin"],
        "category": "Penicillin Antibiotic",
        "purpose": "Treating wide variety of bacterial infections (throat, sinus, middle ear, urinary tract, dental infections).",
        "side_effects": {
            "common": ["Nausea", "Vomiting", "Diarrhea", "Mild skin rash"],
            "rare": ["Tooth discoloration (reversible)", "Dizziness"],
            "serious": ["Severe watery/bloody diarrhea", "Yeast infections (oral thrush, vaginal yeast infection)"],
            "emergency": ["Severe allergic reaction (Anaphylaxis)", "Difficulty breathing", "Stevens-Johnson syndrome"]
        },
        "food_interactions": [
            "Can be taken with food to reduce stomach upset.",
            "Does not have major food restrictions."
        ],
        "alcohol_interaction": {
            "risk_level": "Low",
            "effects": "Does not directly interact, but alcohol can delay healing, cause dehydration, and worsen GI symptoms.",
            "warnings": "Avoid alcohol during any infection to allow your body to heal efficiently."
        },
        "precautions": [
            "Contraindicated in individuals with a known allergy to penicillin or cephalosporin antibiotics."
        ]
    },
    "atorvastatin": {
        "active_ingredients": ["atorvastatin"],
        "category": "HMG-CoA Reductase Inhibitor (Statin)",
        "purpose": "Lowering cholesterol and triglycerides in the blood, and reducing the risk of stroke, heart attack, or other heart complications.",
        "side_effects": {
            "common": ["Joint pain", "Diarrhea", "Cold-like symptoms", "Mild muscle aches"],
            "rare": ["Memory issues", "Increased blood sugar"],
            "serious": ["Myopathy / Rhabdomyolysis (severe muscle breakdown leading to kidney failure)", "Liver enzyme elevations"],
            "emergency": ["Unexplained, severe muscle pain/weakness accompanied by fever and dark-colored urine", "Severe abdominal pain", "Anaphylaxis"]
        },
        "food_interactions": [
            "Avoid consuming large quantities of grapefruit juice (>1 quart daily) as it increases statin levels in the blood, raising muscle toxicity risk."
        ],
        "alcohol_interaction": {
            "risk_level": "Medium",
            "effects": "Increases the risk of liver damage and exacerbates muscle pain side effects.",
            "warnings": "Limit alcohol consumption. Heavy daily drinking combined with statins significantly increases liver failure risks."
        },
        "precautions": [
            "Contraindicated in active liver disease.",
            "Discontinue immediately if pregnancy occurs, as it can cause fetal harm."
        ]
    }
}

# Pairwise drug-drug interactions (generic ingredients, lowercased keys)
# Represents known adverse interaction risks
DRUG_INTERACTIONS = {
    # warfarin + aspirin
    ("warfarin", "aspirin"): {
        "risk_level": "High",
        "description": "Aspirin enhances the anticoagulant effect of Warfarin. Both drugs thin the blood but via different mechanisms. Combining them increases the risk of severe, life-threatening hemorrhage (internal bleeding).",
        "precautions": "Avoid combination unless specifically directed by a cardiologist. If taken together, monitor INR levels closely, watch for signs of bleeding (bruising, blood in urine, black stools), and consult a doctor immediately."
    },
    # warfarin + ibuprofen
    ("warfarin", "ibuprofen"): {
        "risk_level": "High",
        "description": "Ibuprofen is an NSAID that damages the stomach lining and inhibits platelets. When taken with Warfarin, it severely increases the risk of gastrointestinal bleeding and ulcers.",
        "precautions": "Avoid combination. Use alternative pain relievers like Paracetamol under medical supervision. Monitor for stomach pain, vomiting blood, or dark stools."
    },
    # aspirin + ibuprofen
    ("aspirin", "ibuprofen"): {
        "risk_level": "Medium",
        "description": "Ibuprofen can block the antiplatelet effect of low-dose Aspirin, reducing Aspirin's cardio-protective benefits. Additionally, taking multiple NSAIDs concurrently increases stomach ulcer and bleeding risks.",
        "precautions": "If taken together, take Aspirin at least 30 minutes before Ibuprofen, or 8 hours after. Limit NSAID combination to prevent severe gastrointestinal irritation."
    },
    # lisinopril + aspirin
    ("lisinopril", "aspirin"): {
        "risk_level": "Medium",
        "description": "Aspirin (especially in high doses) can reduce the blood-pressure-lowering effect of Lisinopril. It also increases the risk of kidney impairment when combined.",
        "precautions": "Monitor blood pressure and kidney function. Low-dose aspirin (75-150mg) is generally safer, but should still be monitored."
    },
    # metformin + contrast dye (contrast agents)
    ("metformin", "contrast dye"): {
        "risk_level": "High",
        "description": "Iodinated contrast agents can cause temporary kidney impairment, which decreases metformin excretion. This leads to metformin accumulation, creating a high risk of life-threatening Lactic Acidosis.",
        "precautions": "Temporarily discontinue Metformin before or at the time of the imaging procedure, and withhold it for 48 hours after the procedure, resuming only after kidney function is verified as normal."
    },
    # sildenafil + nitroglycerin (nitrates)
    ("sildenafil", "nitroglycerin"): {
        "risk_level": "High",
        "description": "Combining Sildenafil (Viagra) with Nitroglycerin or other nitrates (used for chest pain/angina) causes an acute, severe, life-threatening drop in blood pressure (hypotension).",
        "precautions": "Absolutely contraindicated. Do not take sildenafil if you are on any nitrate medication. If chest pain occurs after taking sildenafil, seek emergency services immediately; do not use nitroglycerin."
    },
    # lisinopril + spironolactone / potassium supplements
    ("lisinopril", "spironolactone"): {
        "risk_level": "High",
        "description": "Both medicines raise potassium levels in the blood. Combining them poses a high risk of severe Hyperkalemia, which can cause fatal cardiac arrhythmias (irregular heartbeats).",
        "precautions": "Avoid combination unless closely monitored by a physician. Regular blood draws are required to check potassium levels. Avoid potassium-containing salt substitutes."
    },
    # azithromycin + amiodarone / qt-prolonging drugs
    ("azithromycin", "amiodarone"): {
        "risk_level": "High",
        "description": "Both drugs prolong the QT interval (the electrical cycle of the heart). Combining them increases the risk of Torsades de Pointes, a severe and potentially fatal heart arrhythmia.",
        "precautions": "Avoid combination. Use alternative antibiotics if amiodarone is required. Monitor for palpitations, dizziness, or fainting."
    },
    # paracetamol + warfarin
    ("paracetamol", "warfarin"): {
        "risk_level": "Medium",
        "description": "Chronic, high-dose use of Paracetamol (>2g/day for several days) can increase the INR (clotting time) in patients taking Warfarin, raising bleeding risks.",
        "precautions": "Occasional single doses of Paracetamol are safe, but chronic use requires monitoring of INR. Consult your healthcare provider."
    }
}
