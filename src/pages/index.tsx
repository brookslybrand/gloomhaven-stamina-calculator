import 'twin.macro'
import Head from 'next/head'
import { FaPlus, FaMinus } from 'react-icons/fa'

export default function Home() {
  const totalCards = 12
  const value = 10
  return (
    <>
      <Head>
        <title>Gloomhaven Stamina Calculator</title>
      </Head>

      <article tw="w-4/5 mx-auto space-y-4 my-4">
        <h1 tw="text-xl text-gray-900">You have {12} rounds left</h1>
        <Slider
          id="hand"
          value={10}
          onChange={(n: number) => {}}
          label={`Cards in hand: ${value}`}
          max={12}
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
      <label htmlFor={id}>{label}</label>
      <div tw="flex w-full space-x-2">
        <button aria-label="subtract 1">
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
        <button aria-label="add 1">
          <FaPlus />
        </button>
      </div>
    </div>
  )
}
