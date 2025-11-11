import os
from openai import AzureOpenAI
from dotenv import load_dotenv
import json
from langgraph.graph import StateGraph, END, START
from langchain_core.prompts import ChatPromptTemplate
from typing import TypedDict
from langchain_openai import AzureOpenAIEmbeddings


load_dotenv()

client = AzureOpenAI(
    azure_endpoint= os.getenv("AZURE_PROJECT_ENDPOINT"),
    api_version= os.getenv("api_version"),
    api_key= os.getenv("subscription_key"),
)

embedclient = AzureOpenAI(
    azure_endpoint= os.getenv("EMBEDDING_ENDPOINT"),
    api_version= os.getenv("embedding_api_version"),
    api_key= os.getenv("embedding_key"),
)


class JDState(TypedDict, total=False):
    jd_text : str
    jd_data : dict
    jd_embeddings : dict


def extract_jd_fields(state : JDState):
    jd_text = state["jd_text"]

    prompt = f"""
        You are an expert recruiter. Extract the key details from this job description
        and return them in valid JSON with the following keys:
                                              
            - Job Title (Optional)
            - Required Skills (List)
            - Education
            - Experience
                                              
        Job Description : {jd_text}
    """

    response = client.chat.completions.create(
        model= os.getenv("MODEL_NAME"),
        messages=[{"role" : "user", "content" : prompt}]
    )

    jd_data = response.choices[0].message.content

    # print(response.choices[0].message.content)

    try:
        jd_data = json.loads(response.choices[0].message.content)
    except Exception as e:
        print("Failed to parse response:", response.choices[0].message.content)
        print("Error:", e)
        jd_data = {
            "Job Title": "",
            "Required Skills": [],
            "Education": "",
            "Experience": ""
        }

    return {"jd_data" : jd_data}


def generate_jd_embeddings(state : JDState):
    jd_data = state["jd_data"]

    skills_text = ",".join(jd_data.get("Required Skills",[]))
    education_text = ",".join(jd_data.get("Education", ""))
    experience_text = ",".join(jd_data.get("Experience", ""))

    embeddings = {
        "skills" : embedclient.embeddings.create(model= os.getenv("EMBEDDING_MODEL"), input= skills_text).data[0].embedding,
        "education" : embedclient.embeddings.create(model= os.getenv("EMBEDDING_MODEL"), input= education_text).data[0].embedding,
        "experience" : embedclient.embeddings.create(model= os.getenv("EMBEDDING_MODEL"), input= experience_text).data[0].embedding
    }

    return {"jd_embeddings" : embeddings, "jd_data" : jd_data}


graph = StateGraph(JDState)
graph.add_node("extract_jd_fields", extract_jd_fields)
graph.add_node("generate_jd_embeddings", generate_jd_embeddings)
graph.add_edge(START, "extract_jd_fields")
graph.add_edge("extract_jd_fields", "generate_jd_embeddings")
graph.add_edge("generate_jd_embeddings", END)

jd_graph = graph.compile()

# if __name__ == "__main__":
#     Input_State = {
#         "jd_text" : f"""
#             Job Description

#             Summary:

#             Software Engineer plays a key role in the software development team on all stages of the software development lifecycle, including design, implementation, and testing activities for Rockwell Automation's industry-leading commercial software known for its innovation and usability, in particular real-time scalable features based on Rockwell's Manufacturing Execution System (MES) that are often integrated with machine automation and control systems and ERP software.

#             Senior Software Engineer is responsible for active participation in requirements development, leading architectural design, coding, and testing in all stages of the software development lifecycle. You will need to collaborate with multiple global teams and you will need to work in the large project teams.

#             Joining Rockwell Automation Software Development group allows to become part of a team that is committed to use reliable and well-thought-out engineering and software development practices such as SAFe (Scaled Agile Framework) as well as open and direct communications and respect

#             Your Responsibilities:
#             Develop and documents code, according to the development process, that satisfies the software design.
#             Develop and execute unit test plans. Reports, debugs, and corrects anomalies. Integrates with other components, solving problems across subsystems and products, to produce a final product.
#             Participate in reviews of documents, designs, code, test cases and user documentation.
#             Provides work estimates and status reports. Maintain adequate interaction to ensure assigned tasks are prioritized appropriately.
#             Support PI planning by working very closely with Team Lead (Scrum Master)
#             Responsible for Sprint Planning including breakdown of user stories into smaller tasks that can be estimated in hours
#             Effectively teams with others through mutually supportive professional relationships.
#             The Essentials - You Will Have:
#             Bachelor's degree in Computer Science, Computer Engineering, Electrical Engineering, or equivalent
#             5 years of experience in new product design of software or software systems including background with large scale enterprise system development projects
#             2 Years of experience in review process (design review, code review)
#             The Preferred - You Might Also Have:
#             Hands-on expert with data structures, algorithms, and object-oriented designs in Java.
#             In depth understanding of multiple design patterns for enterprise applications
#             Experience with different UX technologies
#             Experience in UI development with Java Swing clients and web technologies (Vaadin, JavaScript)
#             Experience with Object Oriented analysis and design using common design patterns.
#             Database design and programming skills in SQL Server and/or Oracle.
#             Familiarity with common development tools as Eclipse, SVN, GitLab, JUnit, JIRA, Jenkins, ANT and Maven
#             Experience with manufacturing domain, especially with life sciences industry
#             Experience with modern software delivery practices like rapid prototyping, CI/CD, containerization, virtualization etc. and various test strategies like TDD / BDD
#             Experience with security, data communication, and contemporary user interface technologies in enterprise environment.
#             Collaboration with global teams
#             Experience with SAFe (Scaled Agile Framework)
#         """
#     }

#     result = jd_graph.invoke(Input_State)

#     print(json.dumps(result["jd_data"], indent=2))
    

#     for key, vec in result["jd_embeddings"].items():
#         print(f"{key} : {len(vec)} dimensions")

def process_jd_text(jd_text : str):
    result = jd_graph.invoke({"jd_text" : jd_text})

    return result["jd_data"], result["jd_embeddings"]