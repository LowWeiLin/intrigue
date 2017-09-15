from Event import Event
from SocialGraph import SocialGraph, Person
from Scenario import Scenario


class TestScenario(Scenario):

    def init_graph(self):
        social_graph = SocialGraph("Test Scenario")
        print(social_graph.scenario_name)

        a = Person(name="A", location="Class A")
        b = Person(name="B", location="Class A")
        c = Person(name="C", location="Class B")

        social_graph.add_persons([a, b, c])

        return social_graph

    def init_events(self):
        return [
            Event(name="Maybe talk",
                  text="Your eyes meet {}.",
                  persons=2,
                  conditions=[
                      lambda graph, persons:
                      persons[0].location == persons[1].location
                  ],
                  effects=[
                      lambda graph, persons:
                      self.set_interacted(persons[0], persons[1])
                  ],
                  choices=[
                      "Talk",
                      "Ignore"
                  ],
                  choices_result_text=[
                      "Hello!",
                      "You walk away."
                  ],
                  choices_effects=[
                        [
                            lambda graph, persons:
                            self.add_sentiment(persons[0], persons[1], 1)
                        ],
                        [
                            lambda graph, persons:
                            self.add_sentiment(persons[0], persons[1], -0.1)
                        ]
                  ]
                  ),
            Event(name="Maybe go for tea",
                  text="You see {}. Invite {} for tea?",
                  persons=2,
                  conditions=[
                      lambda graph, persons:
                      persons[0].location == persons[1].location,
                      lambda graph, persons:
                      persons[1] in self.graph.graph[persons[0]] and
                      graph.graph[persons[0]][persons[1]]['sentiment'] >= 3
                  ],
                  effects=[
                      lambda graph, persons:
                      self.set_interacted(persons[0], persons[1])
                  ],
                  choices=[
                      "Yes",
                      "No"
                  ],
                  choices_result_text=[
                      "Tea was great!",
                      "Maybe next time."
                  ],
                  choices_effects=[
                        [
                            lambda graph, persons:
                            self.add_sentiment(persons[0], persons[1], 10)
                        ],
                        [
                            lambda graph, persons:
                            self.add_sentiment(persons[0], persons[1], -0.1)
                        ]
                  ]
                  ),
            Event(name="Go to Class A",
                  text="You walk to class A",
                  persons=1,
                  conditions=[
                      lambda graph, persons:
                      persons[0].location != "Class A"
                  ],
                  effects=[
                      lambda graph, persons:
                      self.set_location(persons[0], "Class A")
                  ]
                  ),
            Event(name="Go to Class B",
                  text="You walk to class B",
                  persons=1,
                  conditions=[
                      lambda graph, persons:
                      persons[0].location != "Class B"
                  ],
                  effects=[
                      lambda graph, persons:
                      self.set_location(persons[0], "Class B")
                  ]
                  )
        ]
