// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AITradeUSDT V2 - With On-Chain Trading
 * @dev ERC-20 Token with built-in faucet and trading functionality
 * Full on-chain trading for AI Trading Platform
 */
contract AITradeUSDT {
    string public name = "AI Trade USDT";
    string public symbol = "atUSDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    uint256 public faucetAmount = 100 * 10**18;
    uint256 public faucetCooldown = 24 hours;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucetClaim;
    
    // Trading structures
    struct Trade {
        uint256 tradeId;
        address trader;
        string symbol;
        string tradeType; // "BUY" or "SELL"
        uint256 amount;
        uint256 price;
        int256 profitLoss;
        uint256 timestamp;
        bool settled;
    }
    
    mapping(address => Trade[]) public userTrades;
    mapping(uint256 => Trade) public trades;
    uint256 public tradeCounter;
    
    // Trading pool (platform reserves for P&L)
    uint256 public tradingPool;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event FaucetClaim(address indexed claimer, uint256 amount, uint256 timestamp);
    event TradeExecuted(uint256 indexed tradeId, address indexed trader, string symbol, string tradeType, uint256 amount, uint256 timestamp);
    event TradeSettled(uint256 indexed tradeId, int256 profitLoss, uint256 timestamp);
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**18;
        balanceOf[owner] = totalSupply;
        
        // Allocate 10% to trading pool
        tradingPool = totalSupply / 10;
        balanceOf[owner] -= tradingPool;
        
        emit Transfer(address(0), owner, totalSupply);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // ========== FAUCET FUNCTIONS ==========
    
    function claimFaucet() external returns (bool) {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + faucetCooldown,
            "Cooldown not finished"
        );
        require(balanceOf[owner] >= faucetAmount, "Faucet empty");
        
        balanceOf[owner] -= faucetAmount;
        balanceOf[msg.sender] += faucetAmount;
        lastFaucetClaim[msg.sender] = block.timestamp;
        
        emit Transfer(owner, msg.sender, faucetAmount);
        emit FaucetClaim(msg.sender, faucetAmount, block.timestamp);
        
        return true;
    }
    
    function canClaimFaucet(address _address) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[_address] + faucetCooldown;
    }
    
    function timeUntilNextClaim(address _address) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[_address] + faucetCooldown;
        if (block.timestamp >= nextClaimTime) return 0;
        return nextClaimTime - block.timestamp;
    }
    
    // ========== TRADING FUNCTIONS ==========
    
    /**
     * @dev Execute a trade - locks user's tokens
     * @param _symbol Trading symbol (e.g., "BTC", "ETH")
     * @param _tradeType "BUY" or "SELL"
     * @param _amount Amount of atUSDT to trade
     * @param _price Current price (for record keeping)
     */
    function executeTrade(
        string memory _symbol,
        string memory _tradeType,
        uint256 _amount,
        uint256 _price
    ) external returns (uint256) {
        require(_amount > 0, "Amount must be > 0");
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        
        // Lock user's tokens
        balanceOf[msg.sender] -= _amount;
        
        // Create trade record
        tradeCounter++;
        Trade memory newTrade = Trade({
            tradeId: tradeCounter,
            trader: msg.sender,
            symbol: _symbol,
            tradeType: _tradeType,
            amount: _amount,
            price: _price,
            profitLoss: 0,
            timestamp: block.timestamp,
            settled: false
        });
        
        trades[tradeCounter] = newTrade;
        userTrades[msg.sender].push(newTrade);
        
        emit TradeExecuted(tradeCounter, msg.sender, _symbol, _tradeType, _amount, block.timestamp);
        
        return tradeCounter;
    }
    
    /**
     * @dev Settle a trade with P&L
     * @param _tradeId Trade ID to settle
     * @param _profitLoss Profit or loss (can be negative)
     */
    function settleTrade(uint256 _tradeId, int256 _profitLoss) external onlyOwner {
        Trade storage trade = trades[_tradeId];
        require(!trade.settled, "Already settled");
        require(trade.trader != address(0), "Trade not found");
        
        trade.profitLoss = _profitLoss;
        trade.settled = true;
        
        // Calculate final amount
        uint256 finalAmount;
        if (_profitLoss >= 0) {
            // Profit: return original + profit from pool
            finalAmount = trade.amount + uint256(_profitLoss);
            require(tradingPool >= uint256(_profitLoss), "Insufficient pool");
            tradingPool -= uint256(_profitLoss);
        } else {
            // Loss: return original - loss, add loss to pool
            uint256 loss = uint256(-_profitLoss);
            if (loss >= trade.amount) {
                finalAmount = 0;
                tradingPool += trade.amount;
            } else {
                finalAmount = trade.amount - loss;
                tradingPool += loss;
            }
        }
        
        // Return tokens to trader
        if (finalAmount > 0) {
            balanceOf[trade.trader] += finalAmount;
        }
        
        // Update user's trade history
        for (uint i = 0; i < userTrades[trade.trader].length; i++) {
            if (userTrades[trade.trader][i].tradeId == _tradeId) {
                userTrades[trade.trader][i].profitLoss = _profitLoss;
                userTrades[trade.trader][i].settled = true;
                break;
            }
        }
        
        emit TradeSettled(_tradeId, _profitLoss, block.timestamp);
    }
    
    /**
     * @dev Get user's trade history
     */
    function getUserTrades(address _user) external view returns (Trade[] memory) {
        return userTrades[_user];
    }
    
    /**
     * @dev Get trade details
     */
    function getTrade(uint256 _tradeId) external view returns (Trade memory) {
        return trades[_tradeId];
    }
    
    /**
     * @dev Get user's trade count
     */
    function getUserTradeCount(address _user) external view returns (uint256) {
        return userTrades[_user].length;
    }
    
    // ========== ERC-20 FUNCTIONS ==========
    
    function transfer(address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    function setFaucetAmount(uint256 _newAmount) external onlyOwner {
        faucetAmount = _newAmount * 10**18;
    }
    
    function mint(uint256 _amount) external onlyOwner {
        uint256 mintAmount = _amount * 10**18;
        totalSupply += mintAmount;
        balanceOf[owner] += mintAmount;
        emit Transfer(address(0), owner, mintAmount);
    }
    
    function addToTradingPool(uint256 _amount) external onlyOwner {
        require(balanceOf[owner] >= _amount, "Insufficient balance");
        balanceOf[owner] -= _amount;
        tradingPool += _amount;
    }
}
