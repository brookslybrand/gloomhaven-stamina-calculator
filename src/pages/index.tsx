import 'twin.macro'
import Head from 'next/head'
import { FaPlus, FaMinus } from 'react-icons/fa'
import { Machine, assign, send } from 'xstate'
import { useMachine } from '@xstate/react'

// The hierarchical (recursive) schema for the states
interface StaminaStateSchema {
  states: {
    incomplete: {}
    valid: {}
    invalid: {}
  }
}

// The events that the machine handles
type StaminaEvent =
  | {
      type: 'UPDATE_CARDS'
      cardType: keyof StaminaContext['cards']
      value: number
    }
  | { type: 'CHECK_CARDS' }
  | { type: 'INCOMPLETE' }
  | { type: 'INVALID' }
  | { type: 'VALID' }

// The context (extended state) of the machine
interface StaminaContext {
  rounds: number
  totalCards: number
  cards: {
    hand: number
    discarded: number
    lost: number
    active: number
  }
}

function getRecordedCards(cards: StaminaContext['cards']) {
  return Object.values(cards).reduce((total, n) => total + n, 0)
}

const staminaMachine = Machine<
  StaminaContext,
  StaminaStateSchema,
  StaminaEvent
>(
  {
    initial: 'incomplete',
    context: {
      rounds: 0,
      totalCards: 12,
      cards: {
        hand: 0,
        discarded: 0,
        lost: 0,
        active: 0,
      },
    },
    states: {
      incomplete: {},
      invalid: {},
      valid: {},
    },
    on: {
      UPDATE_CARDS: {
        actions: ['updateCards', send('CHECK_CARDS')],
      },
      CHECK_CARDS: {
        actions: ['checkCards'],
      },
      INCOMPLETE: 'incomplete',
      INVALID: 'invalid',
      VALID: 'valid',
    },
  },
  {
    actions: {
      updateCards: assign((context, event) => {
        if (event.type !== 'UPDATE_CARDS') {
          throw new Error(`Invalid event type ${event.type}`)
        }

        const cardsCopy = { ...context.cards }
        cardsCopy[event.cardType] = event.value
        return { ...context, cards: cardsCopy }
      }),
      checkCards: send((context) => {
        const { totalCards, cards } = context
        const totalRecordedCards = getRecordedCards(cards)
        if (totalRecordedCards < totalCards) {
          return { type: 'INCOMPLETE' }
        } else if (totalRecordedCards > totalCards) {
          return { type: 'INVALID' }
        } else {
          return { type: 'VALID' }
        }
      }),
    },
  }
)

export default function Home() {
  const [state, send] = useMachine(staminaMachine)
  const { totalCards, cards } = state.context
  const { hand, discarded, lost, active } = cards

  const cardDifference = totalCards - getRecordedCards(cards)

  return (
    <>
      <Head>
        <title>Gloomhaven Stamina Calculator</title>
      </Head>

      <article tw="w-4/5 mx-auto space-y-4 my-4">
        <h1 tw="font-display text-xl text-gray-900">
          {state.matches('incomplete')
            ? `${cardDifference} card${cardDifference > 1 ? 's' : ''} remaining`
            : state.matches('invalid')
            ? `${Math.abs(cardDifference)} extra card${
                cardDifference < -1 ? 's' : ''
              }`
            : state.matches('valid')
            ? `You have ${12} rounds left`
            : null}
        </h1>
        <Slider
          id="hand"
          value={hand}
          onChange={(value) =>
            send({ type: 'UPDATE_CARDS', cardType: 'hand', value })
          }
          label={`Cards in hand: ${hand}`}
          max={totalCards}
        />
        <Slider
          id="lost"
          value={lost}
          onChange={(value) =>
            send({ type: 'UPDATE_CARDS', cardType: 'lost', value })
          }
          label={`Lost cards: ${lost}`}
          max={totalCards}
        />
        <Slider
          id="discarded"
          value={discarded}
          onChange={(value) =>
            send({ type: 'UPDATE_CARDS', cardType: 'discarded', value })
          }
          label={`Discarded cards: ${discarded}`}
          max={totalCards}
        />
        <Slider
          id="active"
          value={active}
          onChange={(value) =>
            send({ type: 'UPDATE_CARDS', cardType: 'active', value })
          }
          label={`Active cards: ${active}`}
          max={totalCards}
        />
      </article>
    </>
  )
}

type SliderProps = {
  id: string
  value: number
  onChange: (n: number) => void
  label: string
  min?: number
  max: number
}
function Slider({ id, value, onChange, label, min = 0, max }: SliderProps) {
  return (
    <div tw="flex flex-col">
      <label tw="font-display text-lg" htmlFor={id}>
        {label}
      </label>
      <div tw="flex w-full space-x-2">
        <button
          aria-label="subtract 1"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <FaMinus />
        </button>
        <input
          tw="w-full"
          value={value}
          onChange={(e) => onChange(Number(e.currentTarget.value))}
          type="range"
          id={id}
          min={min}
          max={max}
        />
        <button
          aria-label="add 1"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <FaPlus />
        </button>
      </div>
    </div>
  )
}
