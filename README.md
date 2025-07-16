asr-webservice

# **Import Model Before Running Backend!**
- Add model `stt_th_fastconformer_ctc_large_nacc_data.nemo` into `/backend/model` folder

# Setup **Front-end** Development
- Run **Front-end** at `root` folder using `npm install && npm run dev`

# Setup **Back-end** Development
- Install requirement in **Back-end** at `root/backend` folder using `pip install -r requirements.txt`
- Run **Back-end** at `root/backend` folder using `uvicorn main:app --reload`
