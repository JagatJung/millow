import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {

  const [providers, setProviders] = useState(null);
  const [escrow, setEscrow] = useState(null);

  const [homes, setHomes] = useState([]);
  const [home, setHome] =  useState();
  const [toggle, setToggle] = useState(false);

  const [account, setAccount] = useState(null);

  const loadBlockchainData = async ()=> {
    const providers = new ethers.providers.Web3Provider(window.ethereum);
    setProviders(providers);

    const network = await providers.getNetwork();

    
    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, providers);
    console.log(realEstate);
    const totalSupply = await realEstate.totalSupply();
    const homes = [];
  
    for (var i = 1; i <= totalSupply ; i++) {
      const uri  =  await realEstate.tokenURI(i);
      // console.log(uri);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push(metadata);
    }

    setHomes(homes);

    const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, providers);
    setEscrow(escrow);


    //on account change
    window.ethereum.on("accountsChanged", async()=>{
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts'});
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  } 

  useEffect(()=>{
    loadBlockchainData();
  },[]);

  const toggleProp = (home) => {
    setHome(home);
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Search/>
      <div className='cards__section'>
        <h3>Homes for You</h3>
        <hr/>
        <div className='cards'>
            {homes.map((home, index) => (
            <div className='card' key={index} onClick={()=> toggleProp(home)}>
              <div className='card__image'>
                <img src={home.image} alt="Home" />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bda |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft 
                </p>
                <p>{home.address}</p>
              </div>
            </div>
            ))}
        </div>
      </div>

      {toggle && (
        <Home  home = {home} account = {account} provider = {providers} escrow = {escrow} togglePop = {toggleProp} />
      )}
    </div>
  );
}

export default App;
