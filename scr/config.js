/**
 * 遊戲設定檔 - 核心數值與平衡調整
 */

export const GAME_SETTINGS = {
    GAME_DURATION: 300,        // 總遊戲時長 (秒)
    GRAVITY: 0.8,              // 重力係數
    GROUND_Y: 380,             // 地平線 Y 座標 (角色站立位置)
    SPAWN_INTERVAL: 2500,      // 隨機事件生成間隔 (毫秒)
    
    // 隨機事件機率 (總和不超過 1.0)
    SPAWN_CHANCE: {
        ENEMY: 0.4,            // 40% 出現怪物
        TOKEN: 0.4,            // 40% 出現代幣
        NOTHING: 0.2           // 20% 平安無事
    }
};

export const CHARACTERS = {
    huaijing: {
        id: 'huaijing',
        name: '虞懷璟',
        hp: 200,               // 血量最高
        speed: 3,              // 移動最慢
        attack: 5,             // 攻擊力低
        frameInterval: 250,    // 走路動畫較沉重
        special: '高生存率',
        width: 64,
        height: 64
    },
    quiqui: {
        id: 'quiqui',
        name: '吳葵葵',
        hp: 80,                // 血量低，考驗走位
        speed: 7,              // 跑最快，5 分鐘內能跑最遠距離
        attack: 25,            // 攻擊力最高
        frameInterval: 100,    // 動畫頻率極快，展現爆發感
        special: '快速擊殺',
        width: 64,
        height: 64
    },
    lingjun: {
        id: 'lingjun',
        name: '泠君',
        hp: 120,               // 血量中等
        speed: 4.5,            // 速度中等
        attack: 10,
        frameInterval: 180,
        healPerSecond: 1,      // 奶媽專屬：每秒自動回血
        special: '持續續航',
        width: 64,
        height: 64
    }
};

export const ENEMY_SETTINGS = {
    basic: {
        hp: 10,
        speed: 2,              // 相對於地面的移動速度
        damage: 15,            // 撞到玩家扣的血量
        reward: 5,             // 擊敗獲得代幣
        width: 50,
        height: 50
    }
};

export const TOKEN_SETTINGS = {
    min_value: 1,
    max_value: 10,
    width: 30,
    height: 30
};
