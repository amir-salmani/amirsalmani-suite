'use client'
import { Environment, OrbitControls } from"@react-three/drei";
import { Book } from"./Book";

export const Experience = ({
 images = [],
 pageColors = [],
 pathPattern ="/assets/nature",
 orbitControls = {},
 ...props
}) => {
 return (
 <>
 <OrbitControls
 enableDamping
 enablePan={false}
 enableZoom={false}
 target={[0, 0, 0]}
 {...orbitControls}
 />
 <Book images={images} pageColors={pageColors} pathPattern={pathPattern} {...props} />
 <Environment files="/cdn/effects/book-flip/studio.hdr?v=3" />
 <directionalLight
 position={[2, 5, 2]}
 intensity={2.5}
 />
 </>
 );
};
