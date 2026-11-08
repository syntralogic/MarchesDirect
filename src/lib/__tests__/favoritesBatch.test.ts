import { afterEach, expect, it, vi } from 'vitest';
import { apiClient, opportunitiesApi } from '../apiClient';
afterEach(()=>vi.restoreAllMocks());
it('retrieves more than 200 saves in bounded batches, removes duplicates and restores user order',async()=>{
 const ids=Array.from({length:205},(_,i)=>String(i));
 const get=vi.spyOn(apiClient,'get').mockImplementation(async(_url,config)=>({data:{results:config!.params.ids.split(',').reverse().map((id:string)=>({id,title:id}))}}));
 const rows=await opportunitiesApi.getMany([...ids,ids[0]]);
 expect(rows.map(x=>x.id)).toEqual(ids);expect(get).toHaveBeenCalledTimes(3);
 expect(get.mock.calls[0][1]!.params.ids.split(',')).toHaveLength(100);expect(get.mock.calls[2][1]!.params.ids.split(',')).toHaveLength(5);
});
it('does not silently return a partial selection when a batch fails',async()=>{
 const get=vi.spyOn(apiClient,'get').mockResolvedValueOnce({data:{results:[{id:'0'}]}}).mockRejectedValueOnce(new Error('offline'));
 await expect(opportunitiesApi.getMany(Array.from({length:201},(_,i)=>String(i)))).rejects.toThrow('offline');expect(get).toHaveBeenCalledTimes(2);
});
it('does not query all opportunities for an empty selection',async()=>{
 const get=vi.spyOn(apiClient,'get');expect(await opportunitiesApi.getMany([])).toEqual([]);expect(get).not.toHaveBeenCalled();
});
