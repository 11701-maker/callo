import React, { useState, useEffect } from 'react';

// ฐานข้อมูลอาหารสำหรับแนะนำ (แคลอรี่โดยประมาณ)
const foodDB = [
  { id: 1, name: 'ส้มตำไทย', cal: 120, emoji: '🥗' },
  { id: 2, name: 'ยำวุ้นเส้นหมูสับ', cal: 150, emoji: '🥗' },
  { id: 3, name: 'สลัดผักไข่ต้ม', cal: 180, emoji: '🥬' },
  { id: 4, name: 'เกาเหลาหมูตุ๋น', cal: 250, emoji: '🍲' },
  { id: 5, name: 'แซนวิชทูน่า', cal: 250, emoji: '🥪' },
  { id: 6, name: 'ข้าวต้มปลา', cal: 300, emoji: '🥣' },
  { id: 7, name: 'ก๋วยเตี๋ยวน้ำใส', cal: 350, emoji: '🍜' },
  { id: 8, name: 'ข้าวไข่เจียว', cal: 450, emoji: '🍳' },
  { id: 9, name: 'ข้าวผัดหมู', cal: 500, emoji: '🍛' },
  { id: 10, name: 'ผัดไทยกุ้งสด', cal: 550, emoji: '🍝' },
  { id: 11, name: 'ข้าวมันไก่', cal: 600, emoji: '🍗' },
  { id: 12, name: 'ข้าวกะเพราไก่ไข่ดาว', cal: 650, emoji: '🍛' },
  { id: 13, name: 'แอปเปิ้ล 1 ลูก', cal: 80, emoji: '🍎' },
  { id: 14, name: 'กล้วยหอม', cal: 120, emoji: '🍌' },
  { id: 15, name: 'โยเกิร์ตไขมันต่ำ', cal: 80, emoji: '🥛' },
  { id: 16, name: 'กาแฟดำ (ไม่หวาน)', cal: 15, emoji: '☕' },
  { id: 17, name: 'ชาไข่มุก (หวานน้อย)', cal: 250, emoji: '🧋' },
];

const MEAL_CONFIG = {
  breakfast: { name: 'มื้อเช้า', ratio: 0.30, emoji: '🌅' },
  lunch: { name: 'มื้อกลางวัน', ratio: 0.35, emoji: '☀️' },
  dinner: { name: 'มื้อเย็น', ratio: 0.25, emoji: '🌙' },
  snack: { name: 'ของว่าง', ratio: 0.10, emoji: '🍪' }
};

export default function App() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    gender: 'female',
    age: 25,
    weight: 55,
    height: 160,
    activity: 1.375, // Light activity default
    goal: 0 // 0 = maintain, -500 = lose, 500 = gain
  });

  const [tdee, setTdee] = useState(0);
  
  // สถานะการกินของแต่ละมื้อ
  const [mealsData, setMealsData] = useState({
    breakfast: { consumed: 0, items: [] },
    lunch: { consumed: 0, items: [] },
    dinner: { consumed: 0, items: [] },
    snack: { consumed: 0, items: [] },
  });

  const calculateCalories = (e) => {
    e.preventDefault();
    
    // Mifflin-St Jeor Equation
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr += (profile.gender === 'male') ? 5 : -161;
    
    const calculatedTdee = Math.round(bmr * profile.activity) + Number(profile.goal);
    setTdee(calculatedTdee);
    setStep(2);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const resetApp = () => {
    setStep(1);
    setMealsData({
      breakfast: { consumed: 0, items: [] },
      lunch: { consumed: 0, items: [] },
      dinner: { consumed: 0, items: [] },
      snack: { consumed: 0, items: [] },
    });
  };

  const MealCard = ({ mealKey, targetCal }) => {
    const data = mealsData[mealKey];
    const config = MEAL_CONFIG[mealKey];
    const remaining = targetCal - data.consumed;
    const [isAdding, setIsAdding] = useState(false);
    const [customFood, setCustomFood] = useState('');
    const [customCal, setCustomCal] = useState('');

    // ประเมินสถานะของมื้อนั้นๆ
    let statusText = '';
    let statusColor = '';
    
    if (remaining > 50) {
      statusText = `ขาดอีก ${remaining} kcal`;
      statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
    } else if (remaining < -50) {
      statusText = `เกินมา ${Math.abs(remaining)} kcal`;
      statusColor = 'bg-red-100 text-red-600 border-red-200';
    } else {
      statusText = `พอดีเป้าหมาย!`;
      statusColor = 'bg-emerald-100 text-emerald-600 border-emerald-200';
    }

    const addFood = (foodName, calories) => {
      if (!foodName || !calories) return;
      setMealsData(prev => ({
        ...prev,
        [mealKey]: {
          consumed: prev[mealKey].consumed + Number(calories),
          items: [...prev[mealKey].items, { name: foodName, cal: Number(calories) }]
        }
      }));
      setCustomFood('');
      setCustomCal('');
      setIsAdding(false);
    };

    const removeFood = (indexToRemove, foodCal) => {
      setMealsData(prev => {
        const newItems = prev[mealKey].items.filter((_, idx) => idx !== indexToRemove);
        return {
          ...prev,
          [mealKey]: {
            consumed: prev[mealKey].consumed - foodCal,
            items: newItems
          }
        };
      });
    };

    // แนะนำอาหารที่แคลอรี่ไม่เกินโควต้าที่เหลือ
    const recommendedFoods = foodDB
      .filter(food => food.cal <= (remaining + 50) && remaining > 50) // ให้เกินได้นิดหน่อย (50kcal)
      .sort((a, b) => b.cal - a.cal) // เรียงจากแคลอรี่มากไปน้อย เพื่อให้อิ่ม
      .slice(0, 4); // แนะนำสูงสุด 4 อย่าง

    return (
      <div className="bg-white rounded-3xl p-5 shadow-lg shadow-rose-100/50 mb-5 border border-rose-50 transition-all">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold text-rose-700 flex items-center gap-2">
            <span>{config.emoji}</span> {config.name}
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-500">เป้าหมาย: {targetCal} kcal</div>
            <div className="text-lg font-bold text-rose-500">{data.consumed} <span className="text-sm font-normal text-gray-400">kcal</span></div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium border mb-4 ${statusColor}`}>
          {statusText}
        </div>

        {/* Food List */}
        {data.items.length > 0 && (
          <ul className="space-y-2 mb-4">
            {data.items.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center bg-rose-50/50 px-3 py-2 rounded-xl text-sm">
                <span className="text-gray-700">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-rose-600">{item.cal} kcal</span>
                  <button onClick={() => removeFood(idx, item.cal)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Add Custom Food */}
        {isAdding ? (
          <div className="bg-rose-50 p-3 rounded-2xl flex gap-2 animate-fade-in-down mb-4">
            <input 
              type="text" 
              placeholder="ชื่ออาหาร" 
              className="flex-1 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-rose-100 focus:border-rose-300"
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
            />
            <input 
              type="number" 
              placeholder="แคลอรี่" 
              className="w-20 bg-white rounded-xl px-3 py-2 text-sm outline-none border border-rose-100 focus:border-rose-300"
              value={customCal}
              onChange={(e) => setCustomCal(e.target.value)}
            />
            <button 
              onClick={() => addFood(customFood, customCal)}
              className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              เพิ่ม
            </button>
            <button 
              onClick={() => setIsAdding(false)}
              className="bg-white text-gray-500 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-2 mb-4 rounded-xl border-2 border-dashed border-rose-200 text-rose-400 font-medium hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center justify-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
            เพิ่มอาหารเอง
          </button>
        )}

        {/* Recommendations */}
        {recommendedFoods.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold text-rose-400 mb-2 uppercase tracking-wide">💡 เมนูแนะนำสำหรับมื้อนี้</p>
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {recommendedFoods.map(food => (
                <button 
                  key={food.id}
                  onClick={() => addFood(food.name, food.cal)}
                  className="flex-shrink-0 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-2 rounded-2xl flex items-center gap-2 transition-colors text-left"
                >
                  <span className="text-xl">{food.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{food.name}</div>
                    <div className="text-xs text-rose-500">{food.cal} kcal</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-rose-50/50 font-sans text-gray-800 pb-10">
      {/* Header */}
      <header className="bg-white px-6 py-5 shadow-sm shadow-rose-100 sticky top-0 z-10 flex justify-center items-center">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 flex items-center gap-2">
          🌸 Pinky Calorie Planner
        </h1>
      </header>

      <main className="max-w-md mx-auto mt-6 px-4">
        {step === 1 ? (
          /* Step 1: Profile Setup Form */
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/50 border border-rose-50 animate-fade-in-up">
            <h2 className="text-xl font-bold text-rose-600 mb-6 text-center">มาคำนวณแคลอรี่ที่เหมาะสมกันเถอะ ✨</h2>
            <form onSubmit={calculateCalories} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">เพศ</label>
                  <select name="gender" value={profile.gender} onChange={handleProfileChange} className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700">
                    <option value="female">หญิง 👩</option>
                    <option value="male">ชาย 👨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">อายุ (ปี)</label>
                  <input type="number" name="age" value={profile.age} onChange={handleProfileChange} required min="10" max="100" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">น้ำหนัก (กก.)</label>
                  <input type="number" name="weight" value={profile.weight} onChange={handleProfileChange} required min="20" max="250" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ส่วนสูง (ซม.)</label>
                  <input type="number" name="height" value={profile.height} onChange={handleProfileChange} required min="100" max="250" className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">กิจกรรมประจำวัน</label>
                <select name="activity" value={profile.activity} onChange={handleProfileChange} className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700">
                  <option value="1.2">นั่งทำงานตลอด (ไม่ได้ออกกำลังกาย)</option>
                  <option value="1.375">ขยับตัวบ้าง (ออกกำลังกาย 1-3 วัน/สัปดาห์)</option>
                  <option value="1.55">แอคทีฟปานกลาง (ออกกำลังกาย 3-5 วัน/สัปดาห์)</option>
                  <option value="1.725">แอคทีฟมาก (ออกกำลังกาย 6-7 วัน/สัปดาห์)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">เป้าหมายของคุณ 🎯</label>
                <select name="goal" value={profile.goal} onChange={handleProfileChange} className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-2.5 outline-none focus:border-rose-400 text-gray-700">
                  <option value="-500">ลดน้ำหนัก (-500 kcal)</option>
                  <option value="0">รักษาน้ำหนัก (พอดีเป้า)</option>
                  <option value="500">เพิ่มน้ำหนัก (+500 kcal)</option>
                </select>
              </div>

              <button type="submit" className="w-full mt-6 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-rose-300/50 transition-transform transform hover:scale-[1.02] active:scale-95 text-lg">
                คำนวณแคลอรี่ของฉัน 💖
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Dashboard & Tracker */
          <div className="animate-fade-in-up">
            
            {/* Summary Widget */}
            <div className="bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-6 shadow-xl shadow-rose-300/40 text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h2 className="text-rose-100 font-medium text-sm">แคลอรี่ที่ควรได้รับต่อวัน</h2>
                  <div className="text-4xl font-black">{tdee} <span className="text-lg font-medium text-rose-100">kcal</span></div>
                </div>
                <button onClick={resetApp} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl backdrop-blur-sm transition-colors text-white text-sm">
                  คำนวณใหม่
                </button>
              </div>

              {/* Progress Bar */}
              <div className="relative z-10 mt-6">
                <div className="flex justify-between text-xs text-rose-100 mb-2 font-medium">
                  <span>กินไปแล้ว {Object.values(mealsData).reduce((sum, meal) => sum + meal.consumed, 0)}</span>
                  <span>เหลืออีก {Math.max(0, tdee - Object.values(mealsData).reduce((sum, meal) => sum + meal.consumed, 0))}</span>
                </div>
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (Object.values(mealsData).reduce((sum, meal) => sum + meal.consumed, 0) / tdee) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Meal Cards */}
            <div className="space-y-4">
              {Object.keys(MEAL_CONFIG).map((key) => (
                <MealCard 
                  key={key} 
                  mealKey={key} 
                  targetCal={Math.round(tdee * MEAL_CONFIG[key].ratio)} 
                />
              ))}
            </div>

          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
}