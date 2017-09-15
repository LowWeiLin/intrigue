from ReignsScenario import ReignsScenario
import random

random.seed(1234567890)


def main():
    scenario = ReignsScenario()
    print(scenario.name)

    [king] = [p for p in scenario.graph.graph.nodes() if 'King' in p.name]

    for timestep in range(4):
        scenario.graph.timestep = timestep

        all_valid_events = scenario.get_all_valid_events()
        valid_events_per_person = scenario.get_valid_events_per_person(
            all_valid_events)
        valid_moves = valid_events_per_person[king]

        event, persons = random.choice(valid_moves)
        event.set_targets(scenario.graph, persons)

        choice = event.get_choice()

        event.apply_effects()

        event.apply_choice_effects(choice)

        print("=========={}==========".format(timestep))
        print(scenario.graph)
        print("=========={}==========".format(timestep))

    print('done')


if __name__ == '__main__':
    main()
