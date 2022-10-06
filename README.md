# D2T Token and Presale contract


In the project directory, you can run:  
  
   
*Please rename the .env_example file to .env and update the file with valid  URL  and private keys* 

## Note-
- Add The private key of account you want the contract to be deployed from.
- You can use [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/) to get the RPC URL
  

Install all the dependencies using  
```
npm install
```

Compiles all the contracts in the directory
```
npx hardhat compile
```
 Runs the test script   

```
npx hardhat test
```

Deploy the Token contract on goerli using
```
npx hardhat run scripts/deployToken.js --network goerli
```
Deploy the Token and  Presale contract
```
npx hardhat run scripts/deployPresale.js --network goerli
```
