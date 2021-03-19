import 'twin.macro'
import Head from 'next/head'
import { FaPlus, FaMinus } from 'react-icons/fa'
import { Machine, assign, send, State } from 'xstate'
import { useMachine } from '@xstate/react'

export default function Home() {
  const [state, send] = useMachine(staminaMachine)
  const { totalCards, cardPlacements } = state.context
  const { hand, discarded, lost, active } = cardPlacements

  const maxCards = totalCards ?? 10 // default to 10 cards when no cards have been given

  return (
    <>
      <Head>
        <title>Gloomhaven Stamina Calculator</title>
      </Head>

      <article tw="mx-auto sm:w-4/5 md:w-96">
        <h1 tw="font-display text-2xl text-gray-900 mt-8">
          <TitleText state={state} />
        </h1>

        <div tw="space-y-4 my-4 mt-8">
          <div tw="flex w-full space-x-4">
            <label tw="font-display text-lg font-semibold" htmlFor="totalCards">
              Total cards:
            </label>
            <input
              id="totalCards"
              tw="rounded-sm border-b border-gray-400  w-14"
              value={totalCards ?? ''} // '' is the null case for inputs
              onChange={(e) => {
                const newTotalCards = e.currentTarget.value
                send({
                  type: 'UPDATE_TOTAL_CARDS',
                  value: newTotalCards === '' ? null : Number(newTotalCards),
                })
              }}
              type="number"
              min="0"
            />
          </div>

          <Slider
            id="hand"
            value={hand}
            onChange={(value) =>
              send({ type: 'UPDATE_CARDS', cardType: 'hand', value })
            }
            label={`Cards in hand: ${hand}`}
            max={maxCards}
          />
          <Slider
            id="lost"
            value={lost}
            onChange={(value) =>
              send({ type: 'UPDATE_CARDS', cardType: 'lost', value })
            }
            label={`Lost cards: ${lost}`}
            max={maxCards}
          />
          <Slider
            id="discarded"
            value={discarded}
            onChange={(value) =>
              send({ type: 'UPDATE_CARDS', cardType: 'discarded', value })
            }
            label={`Discarded cards: ${discarded}`}
            max={maxCards}
          />
          <Slider
            id="active"
            value={active}
            onChange={(value) =>
              send({ type: 'UPDATE_CARDS', cardType: 'active', value })
            }
            label={`Active cards: ${active}`}
            max={maxCards}
          />
        </div>
      </article>
    </>
  )
}

type TitleTextProps = {
  state: State<
    StaminaContext,
    StaminaEvent,
    any,
    {
      value: any
      context: StaminaContext
    }
  >
}
function TitleText({ state }: TitleTextProps) {
  const { totalCards, placedCards, cardPlacements } = state.context
  if (state.matches('invalid')) {
    return <>Please fill out the total cards</>
  } else if (state.matches('missingCards')) {
    if (totalCards === null) {
      throw new Error(`Total cards cannot be null in state ${state.value}`)
    }
    const remainingCards = totalCards - placedCards
    return (
      <>
        You have {remainingCards} {cardOrCards(remainingCards)} remaining
      </>
    )
  } else if (state.matches('extraCards')) {
    if (totalCards === null) {
      throw new Error(`Total cards cannot be null in state ${state.value}`)
    }
    const extraCards = placedCards - totalCards
    return (
      <>
        You've played {extraCards} {cardOrCards(extraCards)} to many
      </>
    )
  } else if (state.matches('valid')) {
    return <>You have {getRemainingRounds(cardPlacements)} rounds left</>
  } else {
    throw new Error(`Invalid state ${state.value}`)
  }
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

// hooks/logic

type TotalCards = number | null

interface StaminaStateSchema {
  states: {
    missingCards: {}
    valid: {}
    extraCards: {}
    invalid: {}
  }
}

type StaminaEvent =
  | {
      type: 'UPDATE_CARDS'
      cardType: keyof StaminaContext['cardPlacements']
      value: number
    }
  | {
      type: 'UPDATE_TOTAL_CARDS'
      value: TotalCards
    }
  | { type: 'MISSING_CARDS' }
  | { type: 'VALID' }
  | { type: 'EXTRA_CARDS' }
  | { type: 'INVALID' }

interface StaminaContext {
  rounds: number
  placedCards: number
  totalCards: TotalCards
  cardPlacements: {
    hand: number
    discarded: number
    lost: number
    active: number
  }
}

const staminaMachine = Machine<
  StaminaContext,
  StaminaStateSchema,
  StaminaEvent
>(
  {
    initial: 'missingCards',
    context: {
      rounds: 0,
      totalCards: 12,
      placedCards: 0,
      cardPlacements: {
        hand: 0,
        discarded: 0,
        lost: 0,
        active: 0,
      },
    },
    states: {
      missingCards: {},
      valid: {},
      extraCards: {},
      invalid: {},
    },
    on: {
      UPDATE_TOTAL_CARDS: {
        actions: ['updateTotalCards', 'checkCards'],
      },
      UPDATE_CARDS: {
        actions: ['updateCards', 'checkCards'],
      },
      MISSING_CARDS: 'missingCards',
      VALID: 'valid',
      EXTRA_CARDS: 'extraCards',
      INVALID: 'invalid',
    },
  },
  {
    actions: {
      updateTotalCards: assign({
        totalCards: (context, event) => {
          if (event.type !== 'UPDATE_TOTAL_CARDS') {
            throw new Error(`Invalid event type ${event.type}`)
          }
          return event.value
        },
      }),
      updateCards: assign((context, event) => {
        if (event.type !== 'UPDATE_CARDS') {
          throw new Error(`Invalid event type ${event.type}`)
        }

        const cardPlacementsCopy = { ...context.cardPlacements }
        cardPlacementsCopy[event.cardType] = event.value
        const placedCards = getPlacedCards(cardPlacementsCopy)
        return { ...context, placedCards, cardPlacements: cardPlacementsCopy }
      }),
      checkCards: send((context) => {
        const { totalCards, placedCards } = context

        if (totalCards === null) {
          return { type: 'INVALID' }
        } else if (placedCards < totalCards) {
          return { type: 'MISSING_CARDS' }
        } else if (placedCards > totalCards) {
          return { type: 'EXTRA_CARDS' }
        } else {
          return { type: 'VALID' }
        }
      }),
    },
  }
)

function getPlacedCards(cards: StaminaContext['cardPlacements']) {
  return Object.values(cards).reduce((total, n) => total + n, 0)
}

function getRemainingRounds(
  cards: Pick<StaminaContext['cardPlacements'], 'hand' | 'discarded'>
) {
  let remainingRounds = 0
  let { hand, discarded } = cards
  // keep iterating while you have at least 2 cards in hand
  // TODO: account for active cards
  while (hand >= 2) {
    hand -= 2
    discarded += 2
    remainingRounds++
    // if you don't have enough to play another round, short rest
    // which means all but one card goes from your discarded to your
    // hand and you repeat the process
    if (hand <= 1 && discarded >= 2) {
      hand += discarded - 1
      discarded = 0
    }
  }

  return remainingRounds
}

/**
 *
 * @param n
 * @returns the word 'card' or 'cards' depending on if n > 1
 */
function cardOrCards(n: number) {
  return `card${n > 1 ? 's' : ''}`
}
