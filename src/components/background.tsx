import tw, { css } from 'twin.macro'
import Image from 'next/image'

const Background = () => (
  <div tw="relative">
    <div
      css={[
        tw`fixed w-screen h-screen overflow-hidden opacity-90`,
        css`
          z-index: -1;
        `,
      ]}
    >
      <Image
        alt=""
        src="/background.jpeg"
        layout="fill"
        objectFit="cover"
        quality={100}
      />
    </div>
  </div>
)

export default Background
