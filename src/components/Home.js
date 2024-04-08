import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, account, provider, escrow, togglePop }) => {
    const [hasBought, setBought] = useState(false);
    const [hasLended, setLended] = useState(false);
    const [hasInspected, setInspected] = useState(false);
    const [hasSold, setSold] = useState(false);

    const [owner, setOwner] = useState(null);

    const [buyer, setBuyer] = useState(null);
    const [lender, setLender] = useState(null);
    const [inspector, setInspector] = useState(null);
    const [seller, setSeller] = useState(null);

    const fetchDetails = async() =>{
        const buyer = await escrow.buyer(home.id);
        setBuyer(buyer);

        const hasBought = await escrow.approval(home.id, buyer);
        setBought(hasBought);

        const seller = await escrow.seller();
        setSeller(seller);

        const hasSold = await escrow.approval(home.id, seller);
        setSold(hasSold);

        const inspector = await escrow.inspector();
        setSeller(inspector);

        const hasInspected = await escrow.approval(home.id, inspector);
        setInspected(hasInspected);

        const lender = await escrow.lender();
        setSeller(lender);

        const hasLended = await escrow.approval(home.id, lender);
        setLended(hasLended);
    }

    const fetchOwner = async()=> {
        if(await escrow.isListed(home.id)) return;

        const owner = await escrow.buyer(home.id);
        setOwner(owner);
    }

    const buyHandler = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id)
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setBought(true)
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        // Inspector updates status
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setInspected(true)
    }

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()
        // Lender sends funds to contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })
        setLended(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()
        // Seller approves...
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()
        // Seller finalize...
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()
        setSold(true)
    }


    useEffect(()=>{
        fetchDetails();
        fetchOwner(); 
    },[hasSold]);

    return (
        <div className="home">
            <div className='home__details'>
                <div className='home__image'>
                    <img src={home.image} alt = "Home" />
                </div>
                <div className='home__overview'>
                    <h1>{home.name}</h1>
                    <p>
                        <strong>{home.attributes[2].value}</strong> bds |
                        <strong>{home.attributes[3].value}</strong> ba |
                        <strong>{home.attributes[4].value}</strong> sqft


                    </p>
                    <p>{home.address}</p>
                    <h2>{home.attributes[0].value} ETH</h2>

                    <div>
                        { owner?(
                            <div className='home__owned'>
                                Owned by : {owner.slice(0,6) + '.....' + owner.slice(38,42)}
                            </div>
                        ) : (
                            (account === inspector) ? (
                                <button className='home__buy' onClick={inspectHandler} disabled = {hasInspected}>
                                    Approve Inspcetion
                                </button>
                            ):(account === lender) ? (
                                <button className='home__buy' onClick={lendHandler} disabled = {hasLended}>Approve and Lend</button>
                            ) : (account === seller) ? (
                                <button className='home__buy' onClick={sellHandler} disabled = {hasSold}>Approve and Sell</button>
                            ) : (
                                <button className='home__buy' onClick={buyHandler} disabled = {hasBought}>Buy</button>
                            )
                        )

                        }

                        <button className='home__contact'>Contact Agent</button>
                    </div>

                    <hr/>
                    <h2>Overview</h2>
                    <p>{home.description}</p>
                    <h2>Facts and Features</h2>
                    <ul>
                        {home.attributes.map((attribute,index)=>(
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}
                    </ul>

                </div>
                <button onClick={togglePop} className='home__close'>
                    <img src = "{close}" alt="close" />
                </button>
            </div>
        </div>
    );
}

export default Home;
