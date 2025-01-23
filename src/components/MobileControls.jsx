/* eslint-disable react/prop-types */
import Draggable from 'react-draggable';

const MobileControls = ({ onMoveLeft, onMoveRight, onMoveDown, onRotate }) => {
 return (
  <Draggable>
   <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg z-50">
    <div className="flex flex-col gap-2">
     <button
      onClick={onMoveLeft}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
     >
      ←
     </button>
     <button
      onClick={onMoveRight}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
     >
      →
     </button>
     <button
      onClick={onMoveDown}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
     >
      ↓
     </button>
     <button
      onClick={onRotate}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
     >
      ↻
     </button>
    </div>
   </div>
  </Draggable>
 );
};

export default MobileControls;