
from itertools import permutations


class Scenario:
    def __init__(self, name="untitled scenario"):
        self.name = name
        self.events = self.init_events()
        self.graph = self.init_graph()

    def __repr__(self):
        return "scenario %s".format(
            self.name)

    def get_valid_persons(self, event, fixed_persons=None):
        persons = self.graph.graph.nodes()
        valid = permutations(persons, event.persons)
        if fixed_persons is not None:
            valid = [x for x in valid if False
                     not in [fixed_persons[i] is None or p == fixed_persons[i]
                             for i, p in enumerate(x)]]
        valid = [x for x in valid if event.conditions_check(self.graph, x)]
        return valid

    def get_all_valid_events(self):
        valid = []
        for event in self.events:
            vals = self.get_valid_persons(event)
            for val in vals:
                valid.append([event, val])
        return valid

    def get_valid_events_per_person(self, all_valid_events=None):
        if all_valid_events is None:
            all_valid_events = self.get_all_valid_events(self.graph)
        valid_events_per_person = {}
        for [event, persons] in all_valid_events:
            p = None
            if len(persons) > 0:
                p = persons[0]
            if valid_events_per_person.get(p) is None:
                valid_events_per_person[p] = []
            valid_events_per_person[p].append([event, persons])
        return valid_events_per_person

    def set_interacted(self, person0, person1):
        self.graph.graph.add_edge(*(person0, person1))
        self.graph.graph[person0][person1]["interacted"] = True

    def add_sentiment(self, person0, person1, value):
        self.graph.graph.add_edge(*(person0, person1))
        if "sentiment" not in self.graph.graph[person0][person1]:
            self.graph.graph[person0][person1]["sentiment"] = 0
        self.graph.graph[person0][person1]["sentiment"] += value

    def get_sentiment(self, person0, person1):
        g = self.graph.graph
        if person0 not in g or person1 not in g[person0] \
                or "sentiment" not in g[person0][person1]:
            return 0
        return self.graph.graph[person0][person1]["sentiment"]

    def set_location(self, person, location):
        person.location = location

    def init_graph(self):
        assert False, 'init_graph must be implemented by subclasses'

    def init_events(self):
        assert False, 'init_events must be implemented by subclasses'
