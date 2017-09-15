import networkx as nx
import uuid
import random

random.seed(1234567890)


class SocialGraph:
    def __init__(self, scenario_name="scenario name"):
        self.scenario_name = scenario_name
        self.graph = nx.Graph()
        self.timestep = 0

    def __repr__(self):
        sorted_edges = sorted(self.graph.edges(data=True),
                              key=lambda x: x[1].name)
        sorted_edges = sorted(sorted_edges, key=lambda x: x[0].name)

        return "Scenario: {}\nPersons:\n{}\nRelations:\n{}".format(
            self.scenario_name,
            sorted(self.graph.nodes(), key=lambda x: x.name),
            "\n".join([str(x) for x in sorted_edges]))

    def add_person(self, person):
        self.graph.add_node(person)

    def add_persons(self, persons):
        self.graph.add_nodes_from(persons)

    def update_relation(self, personA, personB, relation):
        if personB not in self.graph[personA]:
            self.graph.add_edge(personA, personB)
        for k, v in relation.items():
            self.graph[personA][personB][k] = v


class Person:
    def __init__(self, name="person name", location="location"):
        self.name = name
        self.location = location
        self.uuid = uuid.UUID(int=random.getrandbits(128))

    def __repr__(self):
        return "{}".format(self.name)
