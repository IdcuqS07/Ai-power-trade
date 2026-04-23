// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AITradeUSDT
 * @dev ERC-20 Token with built-in faucet for AI Trading Platform
 * Deployed on BSC Testnet for WEEX AI Trading Hackathon
 */
contract AITradeUSDT {
    string public name = "AI Trade USDT";
    string public symbol = "atUSDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    uint256 public faucetAmount = 100 * 10**18; // 100 atUSDT per claim
    uint256 public faucetCooldown = 24 hours;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public lastFaucetClaim;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event FaucetClaim(address indexed claimer, uint256 amount, uint256 timestamp);
    event FaucetAmountUpdated(uint256 newAmount);
    
    constructor(uint256 _initialSupply) {
        owner = msg.sender;
        totalSupply = _initialSupply * 10**18;
        balanceOf[owner] = totalSupply;
        emit Transfer(address(0), owner, totalSupply);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    /**
     * @dev Faucet function - Anyone can claim test tokens
     * @notice Claims are limited to once per cooldown period
     */
    function claimFaucet() external returns (bool) {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + faucetCooldown,
            "Cooldown period not finished"
        );
        require(balanceOf[owner] >= faucetAmount, "Faucet is empty");
        
        balanceOf[owner] -= faucetAmount;
        balanceOf[msg.sender] += faucetAmount;
        lastFaucetClaim[msg.sender] = block.timestamp;
        
        emit Transfer(owner, msg.sender, faucetAmount);
        emit FaucetClaim(msg.sender, faucetAmount, block.timestamp);
        
        return true;
    }
    
    /**
     * @dev Check if address can claim from faucet
     */
    function canClaimFaucet(address _address) external view returns (bool) {
        return block.timestamp >= lastFaucetClaim[_address] + faucetCooldown;
    }
    
    /**
     * @dev Get time until next faucet claim
     */
    function timeUntilNextClaim(address _address) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[_address] + faucetCooldown;
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @dev Standard ERC-20 transfer
     */
    function transfer(address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    /**
     * @dev Standard ERC-20 approve
     */
    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /**
     * @dev Standard ERC-20 transferFrom
     */
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
        require(_to != address(0), "Cannot transfer to zero address");
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
    
    /**
     * @dev Owner can update faucet amount
     */
    function setFaucetAmount(uint256 _newAmount) external onlyOwner {
        faucetAmount = _newAmount * 10**18;
        emit FaucetAmountUpdated(_newAmount);
    }
    
    /**
     * @dev Owner can mint more tokens if needed
     */
    function mint(uint256 _amount) external onlyOwner {
        uint256 mintAmount = _amount * 10**18;
        totalSupply += mintAmount;
        balanceOf[owner] += mintAmount;
        emit Transfer(address(0), owner, mintAmount);
    }
}
