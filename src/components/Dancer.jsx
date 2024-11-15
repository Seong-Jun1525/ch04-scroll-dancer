import { Box, Circle, Points, PositionalAudio, useAnimations, useGLTF, useScroll, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { IsEnteredAtom } from '../stores'
import Loader from './Loader'
import gsap from 'gsap'
import * as THREE from 'three'

/** Timeline
 * animation을 시간 순서에 따라 제어하고자 할 때 사용
 */

let timeline
const colors = {
    boxMaterialColor: "#dc4f00"
}

const Dancer = () => {
    const three = useThree()
    /** 
     * - useRecoilValue
     * 해당 값만 필요할 때 사용하는 훅
     * 
     * - useRecoilState
     * 값을 변경하기도 할때 사용하는 훅
     */
    const isEntered = useRecoilValue(IsEnteredAtom)
    const dancerRef = useRef(null)
    const boxRef = useRef(null) // 모든 요소를 감싸고 있는 box
    const starGroupRef01 = useRef(null)
    const starGroupRef02 = useRef(null)
    const starGroupRef03 = useRef(null)
    const rectAreaLightRef = useRef(null)
    const hemisphereLightRef = useRef(null)

    const {scene, animations} = useGLTF("/models/dancer.glb")
    // console.log(scene, animations) // group => scene

    const texture = useTexture('/texture/5.png')

    const {actions} = useAnimations(animations, dancerRef)
    // console.log(actions)

    const [currentAnimation, setCurrentAnimation] = useState('wave')
    const [rotateFinished, setRotateFinished] = useState(false)

    const {positions} = useMemo(() => {
        const count = 500
        const positions = new Float32Array(count * 3)
        for (let index = 0; index < count * 3; index++) {
            positions[index] = (Math.random() - 0.5) * 25
        }
        return {positions}
    }, [])

    const scroll = useScroll()
    // console.log(scroll)

    

    useFrame(() => {
        // console.log(scroll.offset) // 현재 scroll한 offset을 0~1까지 환산 값
        if(!isEntered) return

        timeline.seek(scroll.offset * timeline.duration()) // timeline을 scroll 기반으로 제어할 수 있게 함
        boxRef.current.material.color = new THREE.Color(colors.boxMaterialColor)

        if(rotateFinished) {
            setCurrentAnimation("breakdancingEnd")
        } else {
            setCurrentAnimation("wave")
        }
    })

    useEffect(() => {
        if(!isEntered) return
        three.camera.lookAt(1, 2, 0)
        actions["wave"].play()
        three.scene.background = new THREE.Color(colors.boxMaterialColor)
        scene.traverse(obj => {
            obj.castShadow = true
            obj.receiveShadow = true
        })
    }, [actions, isEntered, three.camera, three.scene])

    useEffect(() => {
        let timeout
        if(currentAnimation === "wave") {
            actions[currentAnimation]?.reset().fadeIn(0.5).play()
        } else {
            actions[currentAnimation]?.reset().fadeIn(0.5).play().setLoop(THREE.LoopOnce, 1)
            timeout = setTimeout(() => {
                if(actions[currentAnimation]) {
                    actions[currentAnimation].paused = true
                }
            }, 8000)
        }
        return () => {
            clearTimeout(timeout)
            actions[currentAnimation]?.reset().fadeOut(0.5).stop()
        }
    }, [actions, currentAnimation])

    useEffect(() => {
        if(!isEntered) return
        if(!dancerRef.current) return
        gsap.fromTo(
            three.camera.position,
            {
                x: -5,
                y: 5,
                z: 5,
            },
            {
                duration: 2.5,
                x: 0,
                y: 6,
                z: 12
            }
        )
        gsap.fromTo(
            three.camera.rotation,
            { z: Math.PI },
            {
                duration: 2.5,
                z: 0
            }
        )
        gsap.fromTo(
            colors,
            {boxMaterialColor: "#0c0400"},
            {duration: 2.5, boxMaterialColor: "#dc4f00"}
        )
        gsap.to(
            starGroupRef01.current,
            {
                yoyo: true, // 애니메이션이 실행된 후 다시 역재생으로 실행한 후 다시 정방향으로 실행하는 것을 설정
                duration: 2,
                repeat: -1, // 무한
                ease: "linear", // 애니메이션이 선형적인 속도로 재생
                size: 0.05
            }            
        )
        gsap.to(
            starGroupRef02.current,
            {
                yoyo: true,
                duration: 3,
                repeat: -1,
                ease: "linear",
                size: 0.05
            }            
        )
        gsap.to(
            starGroupRef03.current,
            {
                yoyo: true,
                duration: 4,
                repeat: -1,
                ease: "linear",
                size: 0.05
            }            
        )
    }, [isEntered, dancerRef.current, three.camera.rotation])

    useEffect(() => {
        if(!isEntered) return
        if(!dancerRef.current) return

        const pivot = new THREE.Group()
        pivot.position.copy(dancerRef.current.position)
        pivot.add(three.camera)
        three.scene.add(pivot)

        timeline = gsap.timeline()
        timeline
        .from(
            dancerRef.current.rotation,
            {
                duration: 4,
                y: -4 * Math.PI
            },
            0.5
        )
        .from(
            dancerRef.current.position,
            {
                duration: 4,
                x: 3
            },
            "<" // 바로 앞에 선행하는 애니메이션과 동일하게 시작하라는 의미
        )
        .to(
            three.camera.position,
            {
                duration: 10,
                x: 2,
                z: 8
            },
            "<"
        )
        .to(
            colors,
            {
                duration: 10,
                boxMaterialColor: "#0c0400"
            },
            "<"
        )
        .to(
            pivot.rotation,
            {
                duration: 10,
                y: Math.PI
            }
        )
        .to(
            three.camera.position,
            {
                duration: 10,
                x: -4,
                z: 12
            },
            "<"
        )
        .to(
            three.camera.position,
            {
                duration: 10,
                x: 0,
                z: 6
            }
        )
        .to(
            three.camera.position,
            {
                duration: 10,
                x: 0,
                z: 16,
                onUpdate: () => { // 애니메이션이 실행되는 시점에 호출되는 메서드
                    setRotateFinished(false)
                }
            }
        )
        .to(
            hemisphereLightRef.current,
            {
                duration: 5,
                intensity: 30
            }
        )
        .to(
            pivot.rotation,
            {
                duration: 15,
                y: Math.PI * 4,
                onUpdate: () => {
                    setRotateFinished(true)
                }
            },
            "<"
        )
        .to(
            colors,
            {
                duration: 15,
                boxMaterialColor: "#dc4f00"
            }
        )

        return () => {
            three.scene.remove(pivot)
        }
    }, [isEntered, three.camera, three.camera.position, three.scene])

    if(isEntered) {
        return (
            <>
                <primitive
                    ref={dancerRef}
                    object={scene}
                    scale={0.05}
                />
                <ambientLight intensity={2} />
                {/* 조명배치 */}
                <rectAreaLight
                    ref={rectAreaLightRef}
                    position={[0, 10, 0]}
                    intensity={30}
                />
                <pointLight
                    position={[0, 5, 0]}
                    intensity={45}
                    castShadow
                    receiveShadow
                />
                <hemisphereLight
                    ref={hemisphereLightRef}
                    position={[0, 5, 0]}
                    intensity={0}
                    groundColor={'lime'}
                    color="blue"
                />
                <Box
                    ref={boxRef}
                    position={[0, 0, 0]}
                    args={[100, 100, 100]}
                >
                    <meshStandardMaterial
                        color={"#dc4f00"}
                        side={THREE.DoubleSide}
                    />
                </Box>
                <Circle
                    castShadow
                    receiveShadow
                    args={[8, 32]}
                    rotation-x={-Math.PI / 2} // rotation을 해주지 않으면 서있는 원판이 됨
                    position-y={-4.4}
                >
                    <meshStandardMaterial
                        color={"#dc4f00"}
                        side={THREE.DoubleSide}
                    />
                </Circle>
                <Points
                    positions={positions.slice(0, positions.length / 3)}
                >
                    <pointsMaterial
                        ref={starGroupRef01}
                        size={0.5}
                        color={new THREE.Color('#dc4f00')}
                        sizeAttenuation // 원근에 따라 크기를 조절하고 싶을 때 사용
                        depthWrite // 앞에 있는게 뒤에 있는 것을 가리고 싶을 때 사용
                        alphaMap={texture}
                        transparent
                        alphaTest={0.001}
                    />
                </Points>
                <Points
                    positions={positions.slice(positions.length / 3, positions.length * 2 / 3)}
                >
                    <pointsMaterial
                        ref={starGroupRef02}
                        size={0.5}
                        color={new THREE.Color('#dc4f00')}
                        sizeAttenuation // 원근에 따라 크기를 조절하고 싶을 때 사용
                        depthWrite // 앞에 있는게 뒤에 있는 것을 가리고 싶을 때 사용
                        alphaMap={texture}
                        transparent
                        alphaTest={0.001}
                    />
                </Points>
                <Points
                    positions={positions.slice(positions.length * 2 / 3, positions.length)}
                >
                    <pointsMaterial
                        ref={starGroupRef03}
                        size={0.5}
                        color={new THREE.Color('#dc4f00')}
                        sizeAttenuation // 원근에 따라 크기를 조절하고 싶을 때 사용
                        depthWrite // 앞에 있는게 뒤에 있는 것을 가리고 싶을 때 사용
                        alphaMap={texture}
                        transparent
                        alphaTest={0.001}
                    />
                </Points>
                <PositionalAudio
                    position={[-24, 0, 0]}
                    autoplay
                    url="/audio/bgm.mp3"
                    distance={50}
                    loop
                />
            </>
        )
    }

    return <Loader isCompleted />   
}

export default Dancer