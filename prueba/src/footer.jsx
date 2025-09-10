import { useState } from 'react'
import './App.css'
import './fonts/fonts.css'
function footer(){
  const [count, setCount] = useState(0)
 return(
    <>< footer className='footer'>
        
        <ul>
            <li>1</li>
            <li>2</li>
        </ul>
        </footer></>
 )
}
export default footer
