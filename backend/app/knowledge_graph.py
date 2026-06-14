import os
from dotenv import load_dotenv
from backend.app.drug_data import DRUG_DATABASE

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# Neo4j Driver Connection setup
neo4j_uri = os.environ.get("NEO4J_URI")
neo4j_user = os.environ.get("NEO4J_USER", "neo4j")
neo4j_password = os.environ.get("NEO4J_PASSWORD")

driver = None
neo4j_active = False

if neo4j_uri and neo4j_password:
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        # Test connection
        driver.verify_connectivity()
        neo4j_active = True
        print("Successfully connected to Neo4j Knowledge Graph!")
    except Exception as e:
        print(f"Warning: Failed to connect to Neo4j ({e}). Utilizing fallback relational knowledge graph.")
else:
    print("Warning: NEO4J credentials not configured. Using fallback local knowledge graph.")


def populate_neo4j_graph():
    """Seeds the Neo4j instance with standard medication nodes and relationships."""
    if not neo4j_active:
        return
    
    query = (
        "MERGE (m:Medicine {name: $drug_name, category: $category}) "
        "WITH m "
        "UNWIND $ingredients AS ing "
        "MERGE (i:Ingredient {name: ing}) "
        "MERGE (m)-[:CONTAINS]->(i) "
        "WITH m "
        "UNWIND $diseases AS dis "
        "MERGE (d:Disease {name: dis}) "
        "MERGE (m)-[:TREATS]->(d) "
        "WITH m "
        "UNWIND $side_effects AS se "
        "MERGE (s:SideEffect {name: se}) "
        "MERGE (m)-[:CAUSES]->(s)"
    )
    
    try:
        with driver.session() as session:
            for drug_name, details in DRUG_DATABASE.items():
                session.run(
                    query,
                    drug_name=drug_name.capitalize(),
                    category=details["category"],
                    ingredients=[x.capitalize() for x in details["active_ingredients"]],
                    diseases=[details["purpose"].capitalize()],
                    side_effects=[x.capitalize() for x in details["side_effects"]["common"][:3]]
                )
            print("Successfully seeded Neo4j nodes and connections.")
    except Exception as e:
        print(f"Failed to seed Neo4j database: {e}")


def get_knowledge_graph_data(active_drugs: list[str] = None) -> dict:
    """
    Returns nodes and edges for knowledge graph visualization.
    Integrates with Neo4j if active, else returns local JSON relationships.
    """
    # Define color groups for visualization:
    # 0: Medicine, 1: Ingredient, 2: Disease, 3: SideEffect, 4: Allergy Alert
    
    # 1. Query Neo4j if active
    if neo4j_active:
        try:
            nodes = []
            edges = []
            node_ids = set()
            
            with driver.session() as session:
                result = session.run(
                    "MATCH (m:Medicine)-[r]-(n) "
                    "RETURN m.name AS med, labels(m)[0] AS med_label, type(r) AS rel, n.name AS target, labels(n)[0] AS target_label"
                )
                for record in result:
                    med = record["med"]
                    target = record["target"]
                    rel = record["rel"]
                    
                    if med not in node_ids:
                        nodes.append({"id": med, "label": med, "group": 0})
                        node_ids.add(med)
                        
                    if target not in node_ids:
                        # Map target label to group number
                        group_map = {"Ingredient": 1, "Disease": 2, "SideEffect": 3}
                        group = group_map.get(record["target_label"], 1)
                        nodes.append({"id": target, "label": target, "group": group})
                        node_ids.add(target)
                        
                    edges.append({"source": med, "target": target, "type": rel})
                    
            if nodes:
                return {"nodes": nodes, "edges": edges}
        except Exception as e:
            print(f"Neo4j retrieval error: {e}. Falling back.")

    # 2. Fallback Relational JSON generator
    # We will build nodes dynamically based on active_drugs (if provided) or standard database
    target_drugs = active_drugs if active_drugs else list(DRUG_DATABASE.keys())
    
    nodes = []
    edges = []
    visited_nodes = set()
    
    for drug_name in target_drugs:
        drug_name_clean = drug_name.lower()
        if drug_name_clean in DRUG_DATABASE:
            details = DRUG_DATABASE[drug_name_clean]
            med_label = drug_name.capitalize()
            
            # Add Medicine Node
            if med_label not in visited_nodes:
                nodes.append({"id": med_label, "label": med_label, "group": 0})
                visited_nodes.add(med_label)
                
            # Add Ingredient Nodes
            for ing in details["active_ingredients"]:
                ing_label = ing.capitalize()
                if ing_label not in visited_nodes:
                    nodes.append({"id": ing_label, "label": ing_label, "group": 1})
                    visited_nodes.add(ing_label)
                edges.append({"source": med_label, "target": ing_label, "type": "CONTAINS"})
                
            # Add Disease Nodes (Purpose)
            dis_label = details["purpose"].capitalize()
            if dis_label not in visited_nodes:
                nodes.append({"id": dis_label, "label": dis_label, "group": 2})
                visited_nodes.add(dis_label)
            edges.append({"source": med_label, "target": dis_label, "type": "TREATS"})
            
            # Add Side Effect Nodes (top 2 common side effects to keep graph clean)
            for se in details["side_effects"]["common"][:2]:
                se_label = se.capitalize()
                if se_label not in visited_nodes:
                    nodes.append({"id": se_label, "label": se_label, "group": 3})
                    visited_nodes.add(se_label)
                edges.append({"source": med_label, "target": se_label, "type": "CAUSES"})
                
    # Add interaction relations between medicines in the graph
    for i in range(len(target_drugs)):
        for j in range(i + 1, len(target_drugs)):
            d1 = target_drugs[i].lower()
            d2 = target_drugs[j].lower()
            
            # check interaction
            if d1 in DRUG_DATABASE and d2 in DRUG_DATABASE:
                details = DRUG_DATABASE[d1]
                for inter in details.get("interactions", []):
                    if inter["drug"].lower() == d2:
                        # Add connection directly
                        edges.append({
                            "source": d1.capitalize(),
                            "target": d2.capitalize(),
                            "type": f"INTERACTS ({inter['severity']})"
                        })

    return {"nodes": nodes, "edges": edges}

# Try to seed Neo4j once on start
try:
    populate_neo4j_graph()
except Exception:
    pass
