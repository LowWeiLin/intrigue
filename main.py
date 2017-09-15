from TestScenario import TestScenario

import random

random.seed(1234567890)


def main():
    scenario = TestScenario()
    print(scenario.name)

    for timestep in range(15):
        scenario.graph.timestep = timestep

        all_valid_events = scenario.get_all_valid_events()
        valid_events_per_person = scenario.get_valid_events_per_person(
            all_valid_events)
        # print("\n".join((str(k) + ": " + str(v)
        # for k,v in valid_events_per_person.items())))

        # for each player
        for (person, valid_events) in valid_events_per_person.items():
            # Pick a random event
            event, persons = random.choice(valid_events)
            event.set_targets(scenario.graph, persons)

            # Pick a random choice
            choice = -1
            if len(event.choices) > 0:
                choice = random.choice(range(len(event.choices)))

            # Apply effects
            event.apply_effects()

            # Print text
            # if person == player:
            print("[{}]\n{}".format(person, event.get_text(choice)))

            # Apply picked choice effects
            event.apply_choice_effects(choice)

        print("=========={}==========".format(timestep))
        print(scenario.graph)
        print("=========={}==========".format(timestep))


def loop():
    pass
    """
    #initialize

    #for each timestep
        #for each person
            #find all events that meet conditions, with N persons involved
            #pick a random valid event
            #execute event
                #apply effects
                #wait for choice, or pick a random choice
                #apply choice effects

        #IDEA: fixed events every timestep
        #IDEA: immediate events - trigger once conditions are fufilled
    """


if __name__ == '__main__':
    main()
